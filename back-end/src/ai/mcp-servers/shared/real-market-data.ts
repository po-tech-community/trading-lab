import type { ConfigService } from '@nestjs/config';
import { PriceService, type PricePoint } from '../../../backtest/price.service';

export interface RealMarketSnapshot extends Record<string, unknown> {
  symbol: string;
  priceUsd: number;
  previousCloseUsd: number | null;
  change24hPercent: number;
  asOf: string;
  source: 'coingecko' | 'alphavantage';
}

export interface RealVolatilitySummary extends Record<string, unknown> {
  symbol: string;
  windowDays: number;
  annualizedVolatility: number;
  averageTrueRangePercent: number;
  regime: 'low' | 'medium' | 'high';
  asOf: string;
  source: 'coingecko' | 'alphavantage';
}

export async function fetchLatestMarketSnapshot(
  symbol: string,
): Promise<RealMarketSnapshot> {
  const upper = symbol.trim().toUpperCase();
  const priceService = createPriceServiceFromEnv();
  const endDate = Date.now();
  const startDate = endDate - 45 * 24 * 60 * 60 * 1000;
  const prices = await priceService.fetchPrices(upper, startDate, endDate);
  const latest = prices[prices.length - 1];
  const previous = prices.length >= 2 ? prices[prices.length - 2] : null;
  const previousCloseUsd = previous ? previous.close : null;
  const change24hPercent =
    previousCloseUsd && previousCloseUsd > 0
      ? Number((((latest.close - previousCloseUsd) / previousCloseUsd) * 100).toFixed(2))
      : 0;

  return {
    symbol: upper,
    priceUsd: Number(latest.close.toFixed(2)),
    previousCloseUsd,
    change24hPercent,
    asOf: new Date(latest.date).toISOString(),
    source: getSourceForSymbol(upper),
  };
}

export async function fetchVolatilitySummary(
  symbol: string,
  windowDays: number,
): Promise<RealVolatilitySummary> {
  const upper = symbol.trim().toUpperCase();
  const priceService = createPriceServiceFromEnv();
  const endDate = Date.now();
  const startDate = endDate - Math.max(windowDays + 21, 45) * 24 * 60 * 60 * 1000;
  const prices = await priceService.fetchPrices(upper, startDate, endDate);
  const sample = prices.slice(-Math.max(2, Math.min(windowDays, prices.length)));
  const returns = buildDailyReturns(sample);
  const averageAbsoluteReturn =
    returns.length > 0
      ? returns.reduce((sum, value) => sum + Math.abs(value), 0) / returns.length
      : 0;
  const meanReturn =
    returns.length > 0
      ? returns.reduce((sum, value) => sum + value, 0) / returns.length
      : 0;
  const variance =
    returns.length > 1
      ? returns.reduce((sum, value) => sum + (value - meanReturn) ** 2, 0) /
        (returns.length - 1)
      : 0;
  const annualizedVolatility = Number((Math.sqrt(variance) * Math.sqrt(365) * 100).toFixed(2));
  const averageTrueRangePercent = Number((averageAbsoluteReturn * 100).toFixed(2));

  return {
    symbol: upper,
    windowDays,
    annualizedVolatility,
    averageTrueRangePercent,
    regime:
      annualizedVolatility >= 60
        ? 'high'
        : annualizedVolatility >= 30
          ? 'medium'
          : 'low',
    asOf: new Date(sample[sample.length - 1].date).toISOString(),
    source: getSourceForSymbol(upper),
  };
}

function createPriceServiceFromEnv(): PriceService {
  const configService = {
    get: (key: string) => process.env[key],
  } as ConfigService;

  return new PriceService(configService);
}

function buildDailyReturns(prices: PricePoint[]): number[] {
  const returns: number[] = [];

  for (let index = 1; index < prices.length; index += 1) {
    const previous = prices[index - 1].close;
    const current = prices[index].close;

    if (previous > 0) {
      returns.push((current - previous) / previous);
    }
  }

  return returns;
}

function getSourceForSymbol(symbol: string): 'coingecko' | 'alphavantage' {
  return symbol === 'BTC' || symbol === 'ETH' ? 'coingecko' : 'alphavantage';
}

