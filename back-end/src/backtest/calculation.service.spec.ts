import { runSingleAssetDcaBacktest, type RunDcaBacktestParams } from './calculation.service';
import type { PricePoint } from './price.service';

describe('runSingleAssetDcaBacktest', () => {
  const day = (value: string) => new Date(`${value}T00:00:00.000Z`).getTime();

  it('calculates daily DCA with timeline and summary', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 20 },
      { date: day('2025-01-03'), close: 25 },
    ];

    const params: RunDcaBacktestParams = {
      amount: 100,
      frequency: 'daily',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-03'),
    };

    const result = runSingleAssetDcaBacktest(prices, params);

    expect(result.timeline).toHaveLength(3);
    expect(result.summary.numberOfPurchases).toBe(3);
    expect(result.summary.totalInvested).toBe(300);
    expect(result.summary.totalHoldings).toBeCloseTo(19, 10); // 10 + 5 + 4
    expect(result.summary.currentValue).toBeCloseTo(475, 10); // 19 * 25
    expect(result.summary.totalReturnPercentage).toBeCloseTo(58.333333, 5);
  });

  it('handles weekly schedule when some calendar days have no prices', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-06'), close: 10 }, // Monday
      { date: day('2025-01-13'), close: 20 }, // Monday
      { date: day('2025-01-21'), close: 25 }, // Tuesday (Monday holiday)
    ];

    const params: RunDcaBacktestParams = {
      amount: 100,
      frequency: 'weekly',
      startDate: day('2025-01-06'),
      endDate: day('2025-01-21'),
    };

    const result = runSingleAssetDcaBacktest(prices, params);

    // Buys happen on first available price point on/after scheduled date.
    expect(result.timeline).toHaveLength(3);
    expect(result.timeline[2].date).toBe(day('2025-01-21'));
    expect(result.summary.totalInvested).toBe(300);
    expect(result.summary.totalHoldings).toBeCloseTo(19, 10); // 10 + 5 + 4
    expect(result.summary.currentValue).toBeCloseTo(475, 10);
  });

  it('supports monthly schedule with day clamping', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-31'), close: 10 },
      { date: day('2025-02-28'), close: 20 },
      { date: day('2025-03-31'), close: 40 },
    ];

    const params: RunDcaBacktestParams = {
      amount: 100,
      frequency: 'monthly',
      startDate: day('2025-01-31'),
      endDate: day('2025-03-31'),
    };

    const result = runSingleAssetDcaBacktest(prices, params);

    expect(result.timeline).toHaveLength(3);
    expect(result.summary.totalInvested).toBe(300);
    expect(result.summary.totalHoldings).toBeCloseTo(17.5, 10); // 10 + 5 + 2.5
    expect(result.summary.currentValue).toBeCloseTo(700, 10); // 17.5 * 40
  });

});

