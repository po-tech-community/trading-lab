import { BadRequestException, Injectable } from '@nestjs/common';
import type { PricePoint } from './price.service';

export type DcaFrequency = 'daily' | 'weekly' | 'monthly';

export interface BacktestTimelinePoint {
  date: number; // epoch ms (UTC midnight)
  close: number;
  unitsBought: number;
  cumulativeUnits: number;
  cumulativeInvested: number;
  portfolioValue: number;
}

export interface BacktestSummary {
  totalInvested: number;
  currentValue: number;
  totalReturnPercentage: number;
  totalHoldings: number;
  numberOfPurchases: number;
}

export interface RunDcaBacktestParams {
  amount: number;
  frequency: DcaFrequency;
  startDate: number; // epoch ms (UTC midnight)
  endDate: number; // epoch ms (UTC midnight)
}

export interface RunDcaBacktestResult {
  summary: BacktestSummary;
  timeline: BacktestTimelinePoint[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toUtcMidnightEpochMs(epochMs: number): number {
  const d = new Date(epochMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function addDaysUtc(epochMs: number, days: number): number {
  const d = new Date(epochMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days);
}

function addMonthsUtcClamped(epochMs: number, months: number): number {
  const d = new Date(epochMs);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  const targetMonthIndex = month + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  // clamp day to last day of target month
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDay);

  return Date.UTC(targetYear, targetMonth, clampedDay);
}

function nextBuyDateEpochMs(currentBuyDate: number, frequency: DcaFrequency): number {
  switch (frequency) {
    case 'daily':
      return addDaysUtc(currentBuyDate, 1);
    case 'weekly':
      return addDaysUtc(currentBuyDate, 7);
    case 'monthly':
      return addMonthsUtcClamped(currentBuyDate, 1);
  }
}

/**
 * Pure calculation engine for a single-asset DCA backtest.
 *
 * - `prices` must be sorted oldest -> newest (PriceService already returns sorted)
 * - Buy schedule is generated from `startDate` and `frequency`
 * - When a scheduled buy date falls on a day with no price point (e.g. weekend for stocks),
 *   the engine executes the buy on the first available price point on/after that date.
 */
export function runSingleAssetDcaBacktest(
  prices: PricePoint[],
  params: RunDcaBacktestParams,
): RunDcaBacktestResult {
  const { amount, frequency } = params;

  if (!isFiniteNumber(amount) || amount <= 0) {
    throw new BadRequestException('Amount must be a positive number.');
  }

  if (!params.frequency || !['daily', 'weekly', 'monthly'].includes(params.frequency)) {
    throw new BadRequestException('Frequency must be one of: daily, weekly, monthly.');
  }

  if (!isFiniteNumber(params.startDate) || !isFiniteNumber(params.endDate)) {
    throw new BadRequestException('startDate and endDate must be epoch milliseconds.');
  }

  const startDate = toUtcMidnightEpochMs(params.startDate);
  const endDate = toUtcMidnightEpochMs(params.endDate);

  if (endDate < startDate) {
    throw new BadRequestException('endDate must be after startDate.');
  }

  if (!Array.isArray(prices) || prices.length === 0) {
    throw new BadRequestException('Price series is empty.');
  }

  const timeline: BacktestTimelinePoint[] = [];
  let cumulativeUnits = 0;
  let cumulativeInvested = 0;
  let numberOfPurchases = 0;

  let nextBuy = startDate;

  for (const point of prices) {
    const date = toUtcMidnightEpochMs(point.date);
    if (date < startDate || date > endDate) continue;
    if (!isFiniteNumber(point.close) || point.close <= 0) continue;

    // Execute buys for any scheduled dates up to this price point.
    // This handles missing trading days by buying on the first available day >= scheduled date.
    while (date >= nextBuy && nextBuy <= endDate) {
      const unitsBought = amount / point.close;
      cumulativeUnits += unitsBought;
      cumulativeInvested += amount;
      numberOfPurchases += 1;

      const portfolioValue = cumulativeUnits * point.close;
      timeline.push({
        date,
        close: point.close,
        unitsBought,
        cumulativeUnits,
        cumulativeInvested,
        portfolioValue,
      });

      nextBuy = nextBuyDateEpochMs(nextBuy, frequency);
    }
  }

  // Use last known close within [startDate, endDate] as "current".
  // If there were no points in range (shouldn't happen if caller uses PriceService properly), error.
  const lastPointInRange = [...prices]
    .reverse()
    .find((p) => {
      const d = toUtcMidnightEpochMs(p.date);
      return d >= startDate && d <= endDate && isFiniteNumber(p.close) && p.close > 0;
    });

  if (!lastPointInRange) {
    throw new BadRequestException('No usable price points in the given date range.');
  }

  const currentValue = cumulativeUnits * lastPointInRange.close;
  const totalReturnPercentage =
    cumulativeInvested === 0 ? 0 : ((currentValue - cumulativeInvested) / cumulativeInvested) * 100;

  return {
    summary: {
      totalInvested: cumulativeInvested,
      currentValue,
      totalReturnPercentage,
      totalHoldings: cumulativeUnits,
      numberOfPurchases,
    },
    timeline,
  };
}

@Injectable()
export class CalculationService {
  runSingleAssetDcaBacktest(prices: PricePoint[], params: RunDcaBacktestParams) {
    return runSingleAssetDcaBacktest(prices, params);
  }
}

