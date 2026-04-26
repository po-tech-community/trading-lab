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

  it('includes trades and timeline sample when provided', () => {
    const result = service.generate({
      userQuery: 'Which trade caused the biggest drawdown?',
      backtestContext: {
        mode: 'single',
        title: 'BTC single run',
        generatedAt: '2026-04-24T12:00:00.000Z',
        summary: {
          totalInvested: 1000,
          currentValue: 930,
          totalReturnPercentage: -7,
        },
        trades: [
          {
            date: '2026-04-22T10:00:00.000Z',
            type: 'SELL',
            price: 65000,
            profit: -24.5,
          },
        ],
        timelineSample: [
          { date: '2026-04-21', value: 980 },
          { date: '2026-04-22', value: 930 },
        ],
      },
    });

    expect(result.userPrompt).toContain('Trades sample:');
    expect(result.userPrompt).toContain(
      '2026-04-22T10:00:00.000Z | SELL | price=65000 | profit=-24.5',
    );
    expect(result.userPrompt).toContain('Timeline sample:');
    expect(result.userPrompt).toContain('2026-04-22 | value=930');
  });

  it('handles boundary userQuery lengths without crashing', () => {
    const minQuery = 'ok';
    const maxQuery = 'a'.repeat(2000);

    const minResult = service.generate({ userQuery: minQuery });
    const maxResult = service.generate({ userQuery: maxQuery });

    expect(minResult.userPrompt).toContain(minQuery);
    expect(maxResult.userPrompt).toContain(maxQuery);
  });
});
