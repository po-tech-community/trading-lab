import { Injectable, Logger } from '@nestjs/common';
import {
  AnalyzeAiDto,
  AnalyzeAiResponse,
  McpExecuteDto,
  McpInspectDto,
  McpInspectResponse,
  toMcpInspectResponse,
} from './dto/analyze-ai.dto';
import { PromptGeneratorService } from './prompt-generator.service';
import { LlmService } from './llm.service';
import { McpRuntimeService } from './mcp/mcp-runtime.service';
import type { Response } from 'express';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly promptGeneratorService: PromptGeneratorService,
    private readonly llmService: LlmService,
    private readonly mcpRuntimeService: McpRuntimeService,
  ) { }

  async analyze(
    input: AnalyzeAiDto,
    actor: { userId: string; email?: string },
  ): Promise<AnalyzeAiResponse> {
    this.logger.log(`[analyze] userId=${actor.userId} query="${input.userQuery.slice(0, 80)}"`);

    const mcpBundle = await this.mcpRuntimeService.collectEvidence(
      actor,
      input.userQuery,
      input,
    );
    this.logger.log(`[analyze] MCP status=${mcpBundle.trace.status} evidence=${mcpBundle.evidence.length}`);

    const prompt = this.promptGeneratorService.generate(input, mcpBundle.evidence);
    this.logger.log('[analyze] Calling LLM...');
    const advice = await this.llmService.generateAdvice(prompt);
    this.logger.log(`[analyze] LLM responded (${advice.length} chars)`);

    return {
      advice,
      suggestedActions: this.buildSuggestedActions(input),
      mcp: mcpBundle.trace,
      evidence: mcpBundle.evidence,
    };
  }

  /**
   * Streaming variant of analyze — collects MCP evidence synchronously,
   * then streams the LLM token-by-token via SSE into the raw Express response.
   *
   * The controller must set SSE headers and pass the raw @Res() before calling this.
   */
  async analyzeStream(
    input: AnalyzeAiDto,
    actor: { userId: string; email?: string },
    res: Response,
  ): Promise<void> {
    this.logger.log(`[analyzeStream] userId=${actor.userId} query="${input.userQuery.slice(0, 80)}"`);

    // 1. Collect MCP evidence (non-streaming, same as before)
    const mcpBundle = await this.mcpRuntimeService.collectEvidence(
      actor,
      input.userQuery,
      input,
    );
    this.logger.log(`[analyzeStream] MCP status=${mcpBundle.trace.status} evidence=${mcpBundle.evidence.length}`);

    // 2. Emit the metadata event so the client can render cards / suggested actions
    //    before the text starts arriving.
    const meta = {
      suggestedActions: this.buildSuggestedActions(input),
      evidence: mcpBundle.evidence,
      mcp: mcpBundle.trace,
    };
    res.write(`data: ${JSON.stringify({ meta })}\n\n`);

    // 3. Stream LLM tokens
    const prompt = this.promptGeneratorService.generate(input, mcpBundle.evidence);
    this.logger.log('[analyzeStream] Streaming LLM tokens...');
    await this.llmService.generateAdviceStream(prompt, res);
    // generateAdviceStream handles res.end() internally
  }

  async inspect(
    input: McpInspectDto,
    actor: { userId: string; email?: string },
  ): Promise<McpInspectResponse> {
    this.logger.log(`[inspect] userId=${actor.userId} query="${input.userQuery.slice(0, 80)}"`);

    const bundle = await this.mcpRuntimeService.inspectWithPlans(
      actor,
      input.userQuery,
      input as AnalyzeAiDto,
    );
    this.logger.log(`[inspect] plannedTools=${bundle.plannedTools.length} mcpStatus=${bundle.trace.status}`);

    return toMcpInspectResponse(bundle);
  }

  async executeApproved(
    input: McpExecuteDto,
    actor: { userId: string; email?: string },
  ): Promise<AnalyzeAiResponse> {
    this.logger.log(
      `[execute] userId=${actor.userId} approvedTools=${input.approvedTools.map((t) => t.toolName).join(',')}`,
    );

    const mcpBundle = await this.mcpRuntimeService.executeApproved(
      actor,
      input.userQuery,
      input as AnalyzeAiDto,
      input.approvedTools,
    );
    this.logger.log(`[execute] evidence=${mcpBundle.evidence.length} items`);

    const prompt = this.promptGeneratorService.generate(
      input as AnalyzeAiDto,
      mcpBundle.evidence,
    );
    this.logger.log('[execute] Calling LLM...');
    const advice = await this.llmService.generateAdvice(prompt);
    this.logger.log(`[execute] LLM responded (${advice.length} chars)`);

    return {
      advice,
      suggestedActions: this.buildSuggestedActions(input as AnalyzeAiDto),
      mcp: mcpBundle.trace,
      evidence: mcpBundle.evidence,
    };
  }

  private buildSuggestedActions(input: AnalyzeAiDto): string[] {
    const context = input.backtestContext;
    if (!context) return [];

    const returnPct = context.summary.totalReturnPercentage;
    const hasTrades = (context.trades?.length ?? 0) > 0;
    const suggestions: string[] = [];

    suggestions.push('Compare weekly vs monthly frequency');

    if (context.mode === 'portfolio') {
      suggestions.push(
        returnPct < 0
          ? 'Rebalance: reduce highest-risk asset weight and re-run'
          : 'Reduce highest-weight asset by 10% and re-run',
      );
      suggestions.push(
        hasTrades
          ? 'Adjust trigger thresholds and compare results'
          : 'Add a stop-loss trigger and compare results',
      );
    } else {
      suggestions.push(
        hasTrades
          ? 'Adjust trigger thresholds and compare results'
          : 'Add a take-profit trigger and compare results',
      );
      suggestions.push(
        returnPct < 0
          ? 'Extend the time period to capture a full market cycle'
          : 'Run a wider stop-loss threshold test',
      );
    }

    return suggestions;
  }
}