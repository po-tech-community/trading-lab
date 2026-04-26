import { Injectable } from '@nestjs/common';
import { AnalyzeAiDto, AnalyzeAiResponse } from './dto/analyze-ai.dto';
import { PromptGeneratorService } from './prompt-generator.service';
import { LlmService } from './llm.service';
import { McpRuntimeService } from './mcp/mcp-runtime.service';

@Injectable()
export class AiService {
  constructor(
    private readonly promptGeneratorService: PromptGeneratorService,
    private readonly llmService: LlmService,
    private readonly mcpRuntimeService: McpRuntimeService,
  ) {}

  async analyze(
    input: AnalyzeAiDto,
    actor: { userId: string; email?: string },
  ): Promise<AnalyzeAiResponse> {
    const mcpBundle = await this.mcpRuntimeService.collectEvidence(
      actor,
      input.userQuery,
      input,
    );
    const prompt = this.promptGeneratorService.generate(input, mcpBundle.evidence);
    const advice = await this.llmService.generateAdvice(prompt);

    return {
      advice,
      // TODO(L4-FE-3): replace static fallback actions with LLM-suggested actions.
      suggestedActions: this.buildSuggestedActions(input),
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
