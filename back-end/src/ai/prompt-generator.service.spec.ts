import { PromptGeneratorService } from './prompt-generator.service';

describe('PromptGeneratorService', () => {
  const service = new PromptGeneratorService();

  it('includes fallback context when backtest snapshot missing', () => {
    const result = service.generate({
      userQuery: 'Why did this underperform?',
    });

    expect(result.userPrompt).toContain('No backtest context provided');
    expect(result.userPrompt).toContain('Why did this underperform?');
  });

  it('includes summary metrics when snapshot is provided', () => {
    const result = service.generate({
      userQuery: 'What changed?',
      backtestContext: {
        mode: 'portfolio',
        title: 'Portfolio test',
        generatedAt: '2026-04-24T12:00:00.000Z',
        summary: {
          totalInvested: 1000,
          currentValue: 1200,
          totalReturnPercentage: 20,
          realizedProfit: 12,
          unrealizedValue: 34,
        },
      },
    });

    expect(result.userPrompt).toContain('Mode: portfolio');
    expect(result.userPrompt).toContain('Total invested: 1000');
    expect(result.userPrompt).toContain('Realized profit: 12');
    expect(result.userPrompt).toContain('Unrealized value: 34');
  });
});
