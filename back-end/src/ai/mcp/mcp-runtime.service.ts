import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AuditService } from '../../audit/audit.service';
import { AnalyzeAiDto } from '../dto/analyze-ai.dto';
import { McpConfigService } from './mcp-config.service';
import { McpPermissionService } from './mcp-permission.service';
import { McpProviderRegistry } from './mcp-provider.registry';
import {
  McpAuditMetadata,
  McpDiscoveredTool,
  McpExecutionBundle,
  McpExecutionEvidence,
  McpInspectionTrace,
  McpProviderConfig,
  McpProviderDiscoveryTrace,
} from './mcp.types';

interface McpInspectionActor {
  userId: string;
  email?: string;
}

interface McpToolExecutionPlan {
  providerId: string;
  toolName: string;
  input: Record<string, unknown>;
}

@Injectable()
export class McpRuntimeService {
  private readonly logger = new Logger(McpRuntimeService.name);

  constructor(
    private readonly mcpConfigService: McpConfigService,
    private readonly mcpProviderRegistry: McpProviderRegistry,
    private readonly mcpPermissionService: McpPermissionService,
    private readonly auditService: AuditService,
  ) {}

  async inspectTools(
    actor: McpInspectionActor,
    userQuery: string,
  ): Promise<McpInspectionTrace> {
    const config = this.mcpConfigService.getRuntimeConfig();
    const audit = this.createAuditMetadata(actor);

    if (!config.enabled) {
      const trace: McpInspectionTrace = {
        enabled: false,
        status: 'disabled',
        fallbackStrategy: config.fallbackStrategy,
        fallbackReason: 'MCP runtime disabled by configuration.',
        timeoutMs: config.timeoutMs,
        retryAttempts: config.retryAttempts,
        providers: [],
        tools: [],
        audit: { ...audit, fallbackUsed: true },
      };

      await this.logInspection(actor.userId, userQuery, trace);
      return trace;
    }

    const providers = this.mcpProviderRegistry.listEnabledProviders();
    if (providers.length === 0) {
      const trace: McpInspectionTrace = {
        enabled: true,
        status: 'no_providers',
        fallbackStrategy: config.fallbackStrategy,
        fallbackReason: 'No enabled MCP providers were configured.',
        timeoutMs: config.timeoutMs,
        retryAttempts: config.retryAttempts,
        providers: [],
        tools: [],
        audit: { ...audit, fallbackUsed: true },
      };

      await this.logInspection(actor.userId, userQuery, trace);
      return trace;
    }

    const providerTraces: McpProviderDiscoveryTrace[] = [];
    const discoveredTools: McpDiscoveredTool[] = [];

    for (const provider of providers) {
      const { tools, trace } = await this.discoverProviderTools(provider, config);
      providerTraces.push(trace);
      discoveredTools.push(...tools);
    }

    const tools = discoveredTools.map((tool) => {
      const decision = this.mcpPermissionService.evaluateTool(tool);
      return {
        ...tool,
        allowed: decision.allowed,
        permissionReason: decision.reason,
      };
    });

    const hasReadyProvider = providerTraces.some(
      (provider) => provider.status === 'ready',
    );
    const fallbackUsed = !hasReadyProvider;
    const trace: McpInspectionTrace = {
      enabled: true,
      status: hasReadyProvider ? 'ready' : 'fallback',
      fallbackStrategy: config.fallbackStrategy,
      fallbackReason: hasReadyProvider
        ? undefined
        : 'Provider discovery failed. Falling back to LLM-only analysis.',
      timeoutMs: config.timeoutMs,
      retryAttempts: config.retryAttempts,
      providers: providerTraces,
      tools,
      audit: { ...audit, fallbackUsed },
    };

    await this.logInspection(actor.userId, userQuery, trace);
    return trace;
  }

  async collectEvidence(
    actor: McpInspectionActor,
    userQuery: string,
    input: AnalyzeAiDto,
  ): Promise<McpExecutionBundle> {
    const trace = await this.inspectTools(actor, userQuery);
    const executionPlans = this.buildExecutionPlans(input, trace);

    if (executionPlans.length === 0) {
      return { trace, evidence: [] };
    }

    const evidence: McpExecutionEvidence[] = [];

    for (const plan of executionPlans) {
      const provider = this.mcpProviderRegistry
        .listEnabledProviders()
        .find((candidate) => candidate.id === plan.providerId);
      const discoveredTool = trace.tools.find(
        (tool) =>
          tool.providerId === plan.providerId &&
          tool.name === plan.toolName &&
          tool.allowed,
      );

      if (!provider || !discoveredTool) {
        continue;
      }

      evidence.push(await this.executeToolPlan(actor.userId, provider, discoveredTool, plan));
    }

    return { trace, evidence };
  }

  private async discoverProviderTools(
    provider: McpProviderConfig,
    config: ReturnType<McpConfigService['getRuntimeConfig']>,
  ): Promise<{
    tools: McpDiscoveredTool[];
    trace: McpProviderDiscoveryTrace;
  }> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt += 1) {
      try {
        const tools = await this.runWithTimeout(
          this.discoverProviderToolsOnce(provider, config),
          config.timeoutMs,
        );

        return {
          tools,
          trace: {
            providerId: provider.id,
            providerName: provider.name,
            transport: provider.transport,
            status: 'ready',
            attempts: attempt,
            discoveredTools: tools.length,
          },
        };
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : 'Unknown MCP discovery error';
        this.logger.warn(
          `MCP provider ${provider.id} discovery failed on attempt ${attempt}: ${lastError}`,
        );

        if (attempt < config.retryAttempts) {
          await this.wait(config.retryBackoffMs * attempt);
        }
      }
    }

    return {
      tools: [],
      trace: {
        providerId: provider.id,
        providerName: provider.name,
        transport: provider.transport,
        status: 'failed',
        attempts: config.retryAttempts,
        discoveredTools: 0,
        error: lastError,
      },
    };
  }

  private async discoverProviderToolsOnce(
    provider: McpProviderConfig,
    config: ReturnType<McpConfigService['getRuntimeConfig']>,
  ): Promise<McpDiscoveredTool[]> {
    const transport = this.createTransport(provider, config.timeoutMs);
    const client = new Client({
      name: config.clientName,
      version: config.clientVersion,
    });

    try {
      await client.connect(transport);
      const response = await client.listTools();
      return response.tools.map((tool) => ({
        providerId: provider.id,
        providerName: provider.name,
        name: tool.name,
        title: tool.title,
        description: tool.description,
        readOnly: Boolean(tool.annotations?.readOnlyHint),
        destructive: Boolean(tool.annotations?.destructiveHint),
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      }));
    } finally {
      await transport.close().catch(() => undefined);
    }
  }

  private buildExecutionPlans(
    input: AnalyzeAiDto,
    trace: McpInspectionTrace,
  ): McpToolExecutionPlan[] {
    const context = input.backtestContext;
    if (!context || trace.status !== 'ready') {
      return [];
    }

    const knownProviderIds = ['backtest-context', 'market-snapshot', 'portfolio-diagnostics'];
    const configuredIds = trace.providers.map((p) => p.providerId);
    const missing = knownProviderIds.filter((id) => !configuredIds.includes(id));
    if (missing.length > 0) {
      this.logger.warn(
        `MCP providers not configured: ${missing.join(', ')}. ` +
        'Set MCP_PROVIDERS env var with matching ids for evidence-backed analysis.',
      );
    }

    const plans: McpToolExecutionPlan[] = [];

    this.pushPlanIfAvailable(trace, plans, {
      providerId: 'backtest-context',
      toolName: 'get_backtest_summary',
      input: { backtestContext: context as unknown as Record<string, unknown> },
    });

    this.pushPlanIfAvailable(trace, plans, {
      providerId: 'backtest-context',
      toolName: 'evaluate_risk_profile',
      input: { backtestContext: context as unknown as Record<string, unknown> },
    });

    if (context.trades?.length) {
      this.pushPlanIfAvailable(trace, plans, {
        providerId: 'backtest-context',
        toolName: 'summarize_trade_history',
        input: {
          backtestContext: context as unknown as Record<string, unknown>,
        },
      });
    }

    const symbols = this.extractSymbols(input);
    const primarySymbol = symbols[0];

    if (primarySymbol) {
      this.pushPlanIfAvailable(trace, plans, {
        providerId: 'market-snapshot',
        toolName: 'get_latest_quote',
        input: { symbol: primarySymbol },
      });

      this.pushPlanIfAvailable(trace, plans, {
        providerId: 'market-snapshot',
        toolName: 'get_volatility_summary',
        input: { symbol: primarySymbol, windowDays: 30 },
      });
    }

    if (context.mode === 'portfolio' && symbols.length > 0) {
      this.pushPlanIfAvailable(trace, plans, {
        providerId: 'portfolio-diagnostics',
        toolName: 'get_drawdown_breakdown',
        input: {
          backtestContext: context as unknown as Record<string, unknown>,
        },
      });

      if (context.assets?.length) {
        this.pushPlanIfAvailable(trace, plans, {
          providerId: 'portfolio-diagnostics',
          toolName: 'get_concentration_risk',
          input: {
            backtestContext: context as unknown as Record<string, unknown>,
          },
        });

        this.pushPlanIfAvailable(trace, plans, {
          providerId: 'portfolio-diagnostics',
          toolName: 'get_asset_contribution',
          input: {
            backtestContext: context as unknown as Record<string, unknown>,
          },
        });
      }
    }

    return plans;
  }

  private pushPlanIfAvailable(
    trace: McpInspectionTrace,
    plans: McpToolExecutionPlan[],
    plan: McpToolExecutionPlan,
  ): void {
    const alreadyPlanned = plans.some(
      (candidate) =>
        candidate.providerId === plan.providerId &&
        candidate.toolName === plan.toolName,
    );
    const tool = trace.tools.find(
      (candidate) =>
        candidate.providerId === plan.providerId &&
        candidate.name === plan.toolName &&
        candidate.allowed,
    );

    if (!alreadyPlanned && tool) {
      plans.push(plan);
    }
  }

  private extractSymbols(input: AnalyzeAiDto): string[] {
    const context = input.backtestContext;
    const symbols = new Set<string>();

    context?.assets?.forEach((asset) => {
      if (asset.symbol) {
        symbols.add(asset.symbol.trim().toUpperCase());
      }
    });

    // Only fall back to heuristic extraction when no explicit asset list is present.
    if (symbols.size === 0 && context?.title) {
      const stopWords = new Set([
        'A', 'AN', 'THE', 'IN', 'ON', 'AT', 'BY', 'TO', 'OF', 'IS', 'MY',
        'DCA', 'TP', 'SL', 'RUN', 'TEST', 'SELL', 'BUY', 'BACKTEST',
        'PORTFOLIO', 'VALUE', 'USD', 'PROFIT', 'LOSS', 'RETURN',
      ]);
      const matches = (context.title.match(/\b[A-Z]{2,5}\b/g) ?? []) as string[];
      matches.forEach((match) => {
        if (!stopWords.has(match)) {
          symbols.add(match);
        }
      });
    }

    return Array.from(symbols);
  }

  private async executeToolPlan(
    userId: string,
    provider: McpProviderConfig,
    tool: McpInspectionTrace['tools'][number],
    plan: McpToolExecutionPlan,
  ): Promise<McpExecutionEvidence> {
    const config = this.mcpConfigService.getRuntimeConfig();

    try {
      const result = await this.runWithTimeout(
        this.callTool(provider, tool.name, plan.input, config),
        config.timeoutMs,
      );
      const summary = this.summarizeToolResult(tool.name, result);
      const evidence: McpExecutionEvidence = {
        source: 'mcp',
        providerId: provider.id,
        providerName: provider.name,
        toolName: tool.name,
        title: tool.title,
        status: 'executed',
        input: plan.input,
        summary,
        structuredContent: result.structuredContent,
      };

      await this.logExecution(userId, evidence);
      return evidence;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown MCP tool execution error';
      const evidence: McpExecutionEvidence = {
        source: 'mcp',
        providerId: provider.id,
        providerName: provider.name,
        toolName: tool.name,
        title: tool.title,
        status: 'failed',
        input: plan.input,
        summary: `Tool execution failed for ${provider.id}.${tool.name}.`,
        error: message,
      };

      await this.logExecution(userId, evidence);
      return evidence;
    }
  }

  private async callTool(
    provider: McpProviderConfig,
    toolName: string,
    args: Record<string, unknown>,
    config: ReturnType<McpConfigService['getRuntimeConfig']>,
  ): Promise<{
    structuredContent?: Record<string, unknown>;
    contentText: string;
  }> {
    const transport = this.createTransport(provider, config.timeoutMs);
    const client = new Client({
      name: config.clientName,
      version: config.clientVersion,
    });

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });

      if ('toolResult' in result) {
        return {
          contentText: JSON.stringify(result.toolResult),
        };
      }

      if (result.isError) {
        const errorText = result.content
          .filter((item) => item.type === 'text')
          .map((item) => item.text)
          .join('\n');
        throw new Error(errorText || `Tool ${toolName} returned isError=true`);
      }

      const text = result.content
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join('\n');

      return {
        structuredContent: result.structuredContent,
        contentText: text,
      };
    } finally {
      await transport.close().catch(() => undefined);
    }
  }

  private summarizeToolResult(
    toolName: string,
    result: { structuredContent?: Record<string, unknown>; contentText: string },
  ): string {
    const structured = result.structuredContent;

    if (toolName === 'get_latest_quote' && structured) {
      return `${structured.symbol} latest quote shows price ${structured.priceUsd} USD with ${structured.change24hPercent}% 24h change.`;
    }

    if (toolName === 'get_volatility_summary' && structured) {
      return `${structured.symbol} volatility summary shows ${structured.annualizedVolatility}% annualized volatility in a ${structured.regime} regime.`;
    }

    if (toolName === 'get_concentration_risk' && structured) {
      const largest = structured.largestPosition as
        | { symbol?: string; weight?: number }
        | undefined;
      return `Concentration risk is ${structured.riskLevel} with largest position ${largest?.symbol ?? 'n/a'} at weight ${largest?.weight ?? 'n/a'}.`;
    }

    if (toolName === 'get_drawdown_breakdown' && structured) {
      return `Portfolio drawdown breakdown estimates max drawdown at ${structured.portfolioMaxDrawdownPercent}% across sampled assets.`;
    }

    if (toolName === 'get_asset_contribution' && structured) {
      const rows = Array.isArray(structured.rows) ? structured.rows : [];
      return `Asset contribution analysis returned ${rows.length} asset contribution rows.`;
    }

    if (toolName === 'get_backtest_summary' && structured) {
      return `Backtest summary shows ${structured.profitState} performance with ${structured.totalReturnPercentage}% total return across ${structured.tradeCount} trades.`;
    }

    if (toolName === 'summarize_trade_history' && structured) {
      return `Trade history summary found ${structured.wins} wins, ${structured.losses} losses, and total realized profit ${structured.totalRealizedProfit}.`;
    }

    if (toolName === 'evaluate_risk_profile' && structured) {
      return `Risk check classified the run as ${structured.riskLevel} risk with sampled drawdown ${structured.sampledDrawdownPercent}%.`;
    }

    return result.contentText.slice(0, 400) || `Tool ${toolName} executed successfully.`;
  }

  private createTransport(provider: McpProviderConfig, timeoutMs: number) {
    if (provider.transport === 'streamable-http') {
      if (!provider.url) {
        throw new Error(`Provider ${provider.id} is missing url.`);
      }

      return new StreamableHTTPClientTransport(new URL(provider.url), {
        requestInit: {
          headers: provider.headers,
          signal: AbortSignal.timeout(timeoutMs),
        },
      });
    }

    if (provider.transport === 'sse') {
      if (!provider.url) {
        throw new Error(`Provider ${provider.id} is missing url.`);
      }

      return new SSEClientTransport(new URL(provider.url), {
        requestInit: {
          headers: provider.headers,
          signal: AbortSignal.timeout(timeoutMs),
        },
      });
    }

    if (!provider.command) {
      throw new Error(`Provider ${provider.id} is missing command.`);
    }

    return new StdioClientTransport({
      command: provider.command,
      args: provider.args,
      cwd: provider.cwd,
      env: provider.env,
      stderr: 'pipe',
    });
  }

  private async runWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      promise.finally(() => clearTimeout(timer)).catch(() => undefined);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }

  private createAuditMetadata(actor: McpInspectionActor): McpAuditMetadata {
    return {
      scope: 'mcp_audit',
      actorUserId: actor.userId,
      actorEmail: actor.email,
      occurredAt: new Date().toISOString(),
      fallbackUsed: false,
    };
  }

  private async logInspection(
    userId: string,
    userQuery: string,
    trace: McpInspectionTrace,
  ): Promise<void> {
    const policy = this.mcpPermissionService.getPolicySnapshot();
    const requestId = randomUUID();

    await this.auditService.logAiEvent('mcp_discovery', userId, {
      requestId,
      userQuery,
      status: trace.status,
      fallbackStrategy: trace.fallbackStrategy,
      fallbackReason: trace.fallbackReason ?? null,
      timeoutMs: trace.timeoutMs,
      retryAttempts: trace.retryAttempts,
      providers: trace.providers,
      tools: trace.tools.map((tool) => ({
        providerId: tool.providerId,
        toolName: tool.name,
        allowed: tool.allowed,
        permissionReason: tool.permissionReason,
        readOnly: tool.readOnly,
        destructive: tool.destructive,
      })),
      policy,
      audit: trace.audit,
    });
  }

  private async logExecution(
    userId: string,
    evidence: McpExecutionEvidence,
  ): Promise<void> {
    await this.auditService.logAiEvent('mcp_tool_execution', userId, {
      providerId: evidence.providerId,
      providerName: evidence.providerName,
      toolName: evidence.toolName,
      status: evidence.status,
      input: evidence.input,
      summary: evidence.summary,
      structuredContent: evidence.structuredContent ?? null,
      error: evidence.error ?? null,
    });
  }
}
