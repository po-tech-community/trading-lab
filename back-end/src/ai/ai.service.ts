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

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly promptGeneratorService: PromptGeneratorService,
    private readonly llmService: LlmService,
    private readonly mcpRuntimeService: McpRuntimeService,
  ) {}

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
    const mode = input.backtestContext?.mode;
    if (mode === 'portfolio') {
      return [
        'Compare weekly vs monthly frequency',
        'Lower stop-loss aggressiveness by 10%',
        'Reduce highest-risk asset weight and re-run',
      ];
    }

    return [
      'Compare weekly vs monthly frequency',
      'Lower sellAction by 10%',
      'Run a wider stop-loss threshold test',
    ];
  }
}
