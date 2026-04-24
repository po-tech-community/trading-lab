import { Injectable } from '@nestjs/common';
import { AnalyzeAiDto } from './dto/analyze-ai.dto';

export interface GeneratedPrompt {
  systemPrompt: string;
  userPrompt: string;
}

@Injectable()
export class PromptGeneratorService {
  generate(input: AnalyzeAiDto): GeneratedPrompt {
    const contextBlock = this.buildContextBlock(input);

    const systemPrompt = [
      'You are a DCA strategy advisor for Trading Lab.',
      'Use only the provided backtest context. Do not invent missing metrics.',
      'Be concise, practical, and evidence-based.',
      'Return markdown with:',
      '1) short direct answer',
      '2) key evidence bullets',
      '3) one risk note',
      '4) one suggested next experiment.',
    ].join('\n');

    const userPrompt = [
      `User question:\n${input.userQuery.trim()}`,
      '',
      'Backtest context:',
      contextBlock,
    ].join('\n');

    return { systemPrompt, userPrompt };
  }

  private buildContextBlock(input: AnalyzeAiDto): string {
    const context = input.backtestContext;
    if (!context) {
      return [
        '- No backtest context provided.',
        '- Explain limitations and suggest what run to execute first.',
      ].join('\n');
    }

    const lines: string[] = [
      `- Mode: ${context.mode}`,
      `- Title: ${context.title}`,
      `- Snapshot time: ${context.generatedAt}`,
      `- Total invested: ${context.summary.totalInvested}`,
      `- Current value: ${context.summary.currentValue}`,
      `- Total return (%): ${context.summary.totalReturnPercentage}`,
    ];

    if (typeof context.summary.realizedProfit === 'number') {
      lines.push(`- Realized profit: ${context.summary.realizedProfit}`);
    }
    if (typeof context.summary.unrealizedValue === 'number') {
      lines.push(`- Unrealized value: ${context.summary.unrealizedValue}`);
    }

    return lines.join('\n');
  }
}
