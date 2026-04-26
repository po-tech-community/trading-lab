import { Injectable } from '@nestjs/common';
import { AnalyzeAiDto } from './dto/analyze-ai.dto';
import { McpExecutionEvidence } from './mcp/mcp.types';

export interface GeneratedPrompt {
  systemPrompt: string;
  userPrompt: string;
}

@Injectable()
export class PromptGeneratorService {
  generate(
    input: AnalyzeAiDto,
    evidence: McpExecutionEvidence[] = [],
  ): GeneratedPrompt {
    const contextBlock = this.buildContextBlock(input);
    const evidenceBlock = this.buildEvidenceBlock(evidence);

    const systemPrompt = [
      'You are a DCA strategy advisor for Trading Lab.',
      'Use only the provided backtest context. Do not invent missing metrics.',
      'If MCP evidence is present, prioritize it over heuristics and cite it in the key evidence bullets.',
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
      '',
      'MCP evidence:',
      evidenceBlock,
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
    if (context.assets?.length) {
      lines.push('- Portfolio weights:');
      context.assets.forEach((asset, index) => {
        lines.push(`  ${index + 1}. ${asset.symbol} | weight=${asset.weight}`);
      });
    }
    if (context.trades?.length) {
      lines.push('- Trades sample:');
      context.trades.forEach((trade, index) => {
        const profitValue =
          typeof trade.profit === 'number' ? trade.profit : 'n/a';
        lines.push(
          `  ${index + 1}. ${trade.date} | ${trade.type} | price=${trade.price} | profit=${profitValue}`,
        );
      });
    }
    if (context.timelineSample?.length) {
      lines.push('- Timeline sample:');
      context.timelineSample.forEach((point, index) => {
        lines.push(`  ${index + 1}. ${point.date} | value=${point.value}`);
      });
    }

    return lines.join('\n');
  }

  private buildEvidenceBlock(evidence: McpExecutionEvidence[]): string {
    if (evidence.length === 0) {
      return '- No MCP evidence available.';
    }

    const lines: string[] = [];

    evidence.forEach((item, index) => {
      lines.push(
        `- Evidence ${index + 1}: ${item.providerId}.${item.toolName} | status=${item.status}`,
      );
      lines.push(`  Summary: ${item.summary}`);
      lines.push(`  Input: ${JSON.stringify(item.input)}`);

      if (item.structuredContent) {
        lines.push(
          `  Structured content: ${JSON.stringify(item.structuredContent)}`,
        );
      }

      if (item.error) {
        lines.push(`  Error: ${item.error}`);
      }
    });

    return lines.join('\n');
  }
}
