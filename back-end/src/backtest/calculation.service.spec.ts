import { BadRequestException } from '@nestjs/common';
import {
  runPortfolioDcaBacktest,
  runSingleAssetDcaBacktest,
  type RunDcaBacktestParams,
  type RunSingleAssetDcaBacktestParams,
} from './calculation.service';
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
    expect(result.timeline[0].costBasisPerUnit).toBeCloseTo(10, 10);
    expect(result.timeline[0].currentValue).toBeCloseTo(100, 10);
    expect(result.timeline[0].unrealizedProfitLossPercentage).toBeCloseTo(
      0,
      10,
    );
    expect(result.timeline[2].costBasisPerUnit).toBeCloseTo(300 / 19, 10);
    expect(result.timeline[2].currentValue).toBeCloseTo(475, 10);
    expect(result.timeline[2].unrealizedProfitLossPercentage).toBeCloseTo(
      58.333333,
      5,
    );
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

  it('executes take-profit sells and updates holdings', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 20 },
      { date: day('2025-01-03'), close: 25 },
    ];

    const params: RunSingleAssetDcaBacktestParams = {
      amount: 100,
      frequency: 'daily',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-03'),
      triggers: {
        takeProfit: {
          threshold: 50,
          sellAction: 50,
        },
      },
    };
    const result = runSingleAssetDcaBacktest(prices, params);

    expect(result.timeline[1].cumulativeUnits).toBeCloseTo(7.5, 10);
    expect(result.timeline[1].portfolioValue).toBeCloseTo(300, 10);
    expect(result.summary.totalHoldings).toBeCloseTo(11.5, 10);
    expect(result.summary.currentValue).toBeCloseTo(437.5, 10);
  });

  it('executes stop-loss sells and moves value to cash', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 5 },
    ];

    const params: RunSingleAssetDcaBacktestParams = {
      amount: 100,
      frequency: 'daily',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-02'),
      triggers: {
        stopLoss: {
          threshold: 20,
          sellAction: 100,
        },
      },
    };
    const result = runSingleAssetDcaBacktest(prices, params);

    expect(result.timeline[1].cumulativeUnits).toBeCloseTo(0, 10);
    expect(result.timeline[1].portfolioValue).toBeCloseTo(150, 10);
    expect(result.timeline[1].currentValue).toBeCloseTo(150, 10);
    expect(result.summary.totalHoldings).toBeCloseTo(0, 10);
    expect(result.summary.currentValue).toBeCloseTo(150, 10);
  });
});

describe('runPortfolioDcaBacktest', () => {
  const day = (value: string) => new Date(`${value}T00:00:00.000Z`).getTime();

  it('splits totalAmount by weight and aggregates portfolio value', () => {
    const d1 = day('2025-01-01');
    const d2 = day('2025-01-02');
    const series: PricePoint[] = [
      { date: d1, close: 10 },
      { date: d2, close: 20 },
    ];
    const seriesBySymbol: Record<string, PricePoint[]> = {
      BTC: series,
      ETH: series.map((p) => ({ ...p })),
    };

    const result = runPortfolioDcaBacktest(seriesBySymbol, {
      assets: [
        { symbol: 'BTC', weight: 50 },
        { symbol: 'ETH', weight: 50 },
      ],
      totalAmount: 100,
      frequency: 'daily',
      startDate: d1,
      endDate: d2,
    });

    expect(result.summary.numberOfPurchases).toBe(2);
    expect(result.summary.totalInvested).toBe(200);
    expect(result.summary.assets).toHaveLength(2);
    expect(result.summary.currentValue).toBeCloseTo(300, 5);
    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[1].portfolioValue).toBeCloseTo(300, 5);
    expect(result.timeline[0].costBasisTotal).toBeCloseTo(100, 10);
    expect(result.timeline[0].currentValue).toBeCloseTo(100, 10);
    expect(result.timeline[0].unrealizedProfitLossPercentage).toBeCloseTo(
      0,
      10,
    );
    expect(result.timeline[1].costBasisTotal).toBeCloseTo(200, 10);
    expect(result.timeline[1].currentValue).toBeCloseTo(300, 10);
    expect(result.timeline[1].unrealizedProfitLossPercentage).toBeCloseTo(
      50,
      10,
    );
  });

  it('throws when weights do not sum to 100', () => {
    expect(() =>
      runPortfolioDcaBacktest(
        { BTC: [{ date: day('2025-01-01'), close: 10 }] },
        {
          assets: [{ symbol: 'BTC', weight: 50 }],
          totalAmount: 100,
          frequency: 'daily',
          startDate: day('2025-01-01'),
          endDate: day('2025-01-01'),
        },
      ),
    ).toThrow(BadRequestException);
  });

  it('matches single-asset backtest when 100% is allocated to one symbol', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 20 },
      { date: day('2025-01-03'), close: 25 },
    ];
    const single = runSingleAssetDcaBacktest(prices, {
      amount: 100,
      frequency: 'daily',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-03'),
    });
    const portfolio = runPortfolioDcaBacktest(
      { BTC: prices },
      {
        assets: [{ symbol: 'BTC', weight: 100 }],
        totalAmount: 100,
        frequency: 'daily',
        startDate: day('2025-01-01'),
        endDate: day('2025-01-03'),
      },
    );
    expect(portfolio.summary.totalInvested).toBeCloseTo(
      single.summary.totalInvested,
      8,
    );
    expect(portfolio.summary.currentValue).toBeCloseTo(
      single.summary.currentValue,
      8,
    );
    expect(portfolio.summary.numberOfPurchases).toBe(
      single.summary.numberOfPurchases,
    );
  });

  it('returns realizedProfit=0, unrealizedValue, and empty trades when no triggers', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 20 },
    ];
    const result = runPortfolioDcaBacktest(
      { BTC: prices },
      {
        assets: [{ symbol: 'BTC', weight: 100 }],
        totalAmount: 100,
        frequency: 'daily',
        startDate: day('2025-01-01'),
        endDate: day('2025-01-02'),
      },
    );
    expect(result.trades).toEqual([]);
    expect(result.summary.realizedProfit).toBe(0);
    expect(result.summary.unrealizedValue).toBeCloseTo(
      result.summary.currentValue,
      8,
    );
  });

  it('executes portfolio take-profit trigger and records trade', () => {
    // Both assets double in price on day 2 -> 100% gain exceeds 50% threshold
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 20 },
    ];
    const result = runPortfolioDcaBacktest(
      { BTC: prices, ETH: prices.map((p) => ({ ...p })) },
      {
        assets: [
          { symbol: 'BTC', weight: 50 },
          { symbol: 'ETH', weight: 50 },
        ],
        totalAmount: 100,
        frequency: 'daily',
        startDate: day('2025-01-01'),
        endDate: day('2025-01-02'),
        triggers: { takeProfit: { threshold: 50, sellAction: 50 } },
      },
    );

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].type).toBe('takeProfit');
    expect(result.trades[0].sellAction).toBe(50);
    expect(result.summary.realizedProfit).toBeGreaterThan(0);
    // After selling 50% of holdings, unrealized value should be less than total current value
    expect(result.summary.unrealizedValue).toBeLessThan(
      result.summary.currentValue,
    );
  });

  it('executes portfolio stop-loss trigger and sells all holdings', () => {
    // Price drops from 10 to 4 -> -60% loss exceeds 20% threshold
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 4 },
    ];
    const result = runPortfolioDcaBacktest(
      { BTC: prices },
      {
        assets: [{ symbol: 'BTC', weight: 100 }],
        totalAmount: 100,
        frequency: 'daily',
        startDate: day('2025-01-01'),
        endDate: day('2025-01-02'),
        triggers: { stopLoss: { threshold: 20, sellAction: 100 } },
      },
    );

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].type).toBe('stopLoss');
    expect(result.summary.unrealizedValue).toBeCloseTo(0, 8);
    expect(result.summary.currentValue).toBeGreaterThan(0);
  });

  it('rejects invalid trigger threshold', () => {
    const prices: PricePoint[] = [{ date: day('2025-01-01'), close: 10 }];
    expect(() =>
      runPortfolioDcaBacktest(
        { BTC: prices },
        {
          assets: [{ symbol: 'BTC', weight: 100 }],
          totalAmount: 100,
          frequency: 'daily',
          startDate: day('2025-01-01'),
          endDate: day('2025-01-01'),
          triggers: { takeProfit: { threshold: 0, sellAction: 50 } },
        },
      ),
    ).toThrow(BadRequestException);
  });

  it('matches single-asset with triggers when 100% allocated to one symbol', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 20 },
      { date: day('2025-01-03'), close: 25 },
    ];
    const triggers = { takeProfit: { threshold: 50, sellAction: 50 } };
    const single = runSingleAssetDcaBacktest(prices, {
      amount: 100,
      frequency: 'daily',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-03'),
      triggers,
    });
    const portfolio = runPortfolioDcaBacktest(
      { BTC: prices },
      {
        assets: [{ symbol: 'BTC', weight: 100 }],
        totalAmount: 100,
        frequency: 'daily',
        startDate: day('2025-01-01'),
        endDate: day('2025-01-03'),
        triggers,
      },
    );
    expect(portfolio.summary.realizedProfit).toBeCloseTo(
      single.summary.realizedProfit,
      8,
    );
    expect(portfolio.summary.unrealizedValue).toBeCloseTo(
      single.summary.unrealizedValue,
      8,
    );
    expect(portfolio.summary.currentValue).toBeCloseTo(
      single.summary.currentValue,
      8,
    );
    expect(portfolio.trades).toHaveLength(single.trades.length);
  });

  it('keeps portfolio timeline consistent after a trigger sell', () => {
    const prices: PricePoint[] = [
      { date: day('2025-01-01'), close: 10 },
      { date: day('2025-01-02'), close: 20 },
      { date: day('2025-01-03'), close: 25 },
    ];

    const result = runPortfolioDcaBacktest(
      { BTC: prices },
      {
        assets: [{ symbol: 'BTC', weight: 100 }],
        totalAmount: 100,
        frequency: 'daily',
        startDate: day('2025-01-01'),
        endDate: day('2025-01-03'),
        triggers: { takeProfit: { threshold: 50, sellAction: 50 } },
      },
    );

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].price).toBeCloseTo(20, 8);
    expect(result.trades[0].units).toBeCloseTo(7.5, 8);
    expect(result.trades[0].assetExecutions).toBeDefined();
    expect(result.trades[0].assetExecutions).toHaveLength(1);
    expect(result.trades[0].assetExecutions?.[0].symbol).toBe('BTC');
    expect(result.trades[0].assetExecutions?.[0].price).toBeCloseTo(20, 8);
    expect(result.trades[0].assetExecutions?.[0].units).toBeCloseTo(7.5, 8);
    expect(result.timeline[1].costBasisTotal).toBeCloseTo(100, 8);
    expect(result.timeline[1].currentValue).toBeCloseTo(300, 8);
    expect(result.timeline[1].assets[0].units).toBeCloseTo(7.5, 8);
    expect(result.timeline[1].assets[0].value).toBeCloseTo(300, 8);
  });
});
