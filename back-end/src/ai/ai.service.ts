import { Injectable } from '@nestjs/common';
import { AnalyzeAiDto, AnalyzeAiResponse } from './dto/analyze-ai.dto';
import { PromptGeneratorService } from './prompt-generator.service';
import { LlmService } from './llm.service';

@Injectable()
export class AiService {
  constructor(
    private readonly promptGeneratorService: PromptGeneratorService,
    private readonly llmService: LlmService,
  ) {}

  async analyze(input: AnalyzeAiDto): Promise<AnalyzeAiResponse> {
    const prompt = this.promptGeneratorService.generate(input);
    const advice = await this.llmService.generateAdvice(prompt);

    return {
      advice,
      // TODO(L4-FE-3): replace static fallback actions with LLM-suggested actions.
      suggestedActions: this.buildSuggestedActions(input),
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
