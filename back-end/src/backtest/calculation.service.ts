import { BadRequestException, Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import type { RunDcaBacktestParams } from './dto/run-dca-backtest.dto';
import type { DcaFrequency } from './dto/dca-frequency';
import type { PricePoint } from './price.service';
import { isFiniteNumber } from './utils/is-finite-number.util';

export type { DcaFrequency } from './dto/dca-frequency';
export type { RunDcaBacktestParams } from './dto/run-dca-backtest.dto';

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

export interface RunDcaBacktestResult {
  summary: BacktestSummary;
  timeline: BacktestTimelinePoint[];
}

/** One row in the portfolio builder; `weight` is a percentage (e.g. 60 = 60%). Sum must be 100. */

export interface PortfolioAssetWeight {
  symbol: string;
  weight: number;
}

export interface RunPortfolioDcaBacktestParams {
  assets: PortfolioAssetWeight[];
  totalAmount: number;
  frequency: DcaFrequency;
  startDate: number;
  endDate: number;
}

export interface PortfolioAssetBreakdown {
  symbol: string;
  weight: number;
  totalUnits: number;
  invested: number;
  currentValue: number;
  returnPercentage: number;
}

export interface PortfolioTimelineAssetSlice {
  symbol: string;
  units: number;
  value: number;
  invested: number;
}

export interface PortfolioBacktestTimelinePoint {
  date: number;
  portfolioValue: number;
  cumulativeInvested: number;
  assets: PortfolioTimelineAssetSlice[];
}

export interface PortfolioBacktestSummary {
  totalInvested: number;
  currentValue: number;
  totalReturnPercentage: number;
  numberOfPurchases: number;
  assets: PortfolioAssetBreakdown[];
}

export interface RunPortfolioDcaBacktestResult {
  summary: PortfolioBacktestSummary;
  timeline: PortfolioBacktestTimelinePoint[];
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

function bnToNumber(n: BigNumber): number {
  return n.toNumber();
}

/**
 * Pure calculation engine for a single-asset DCA backtest.
 *
 * - `prices` must be sorted oldest -> newest (PriceService already returns sorted)
 * - Buy schedule is generated from `startDate` and `frequency`
 * - When a scheduled buy date falls on a day with no price point (e.g. weekend for stocks),
 *   the engine executes the buy on the first available price point on/after that date.
 *
 * Input constraints (`amount`, `frequency`, etc.) should be enforced at the API boundary
 * via {@link RunDcaBacktestDto} and ValidationPipe.
 */
export function runSingleAssetDcaBacktest(
  prices: PricePoint[],
  params: RunDcaBacktestParams,
): RunDcaBacktestResult {
  const { amount, frequency } = params;

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

  const amountBn = new BigNumber(amount);
  const timeline: BacktestTimelinePoint[] = [];
  let cumulativeUnitsBn = new BigNumber(0);
  let cumulativeInvestedBn = new BigNumber(0);
  let numberOfPurchases = 0;

  let nextBuy = startDate;

  for (const point of prices) {
    const date = toUtcMidnightEpochMs(point.date);
    if (date < startDate || date > endDate) continue;
    if (!isFiniteNumber(point.close) || point.close <= 0) continue;

    const closeBn = new BigNumber(point.close);

    // Execute buys for any scheduled dates up to this price point.
    // This handles missing trading days by buying on the first available day >= scheduled date.
    while (date >= nextBuy && nextBuy <= endDate) {
      const unitsBoughtBn = amountBn.dividedBy(closeBn);
      cumulativeUnitsBn = cumulativeUnitsBn.plus(unitsBoughtBn);
      cumulativeInvestedBn = cumulativeInvestedBn.plus(amountBn);
      numberOfPurchases += 1;

      const portfolioValueBn = cumulativeUnitsBn.multipliedBy(closeBn);
      timeline.push({
        date,
        close: point.close,
        unitsBought: bnToNumber(unitsBoughtBn),
        cumulativeUnits: bnToNumber(cumulativeUnitsBn),
        cumulativeInvested: bnToNumber(cumulativeInvestedBn),
        portfolioValue: bnToNumber(portfolioValueBn),
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

  const lastCloseBn = new BigNumber(lastPointInRange.close);
  const currentValueBn = cumulativeUnitsBn.multipliedBy(lastCloseBn);
  const currentValue = bnToNumber(currentValueBn);
  const cumulativeInvested = bnToNumber(cumulativeInvestedBn);

  const totalReturnPercentage = cumulativeInvestedBn.isZero()
    ? 0
    : bnToNumber(
        currentValueBn.minus(cumulativeInvestedBn).dividedBy(cumulativeInvestedBn).multipliedBy(100),
      );

  return {
    summary: {
      totalInvested: cumulativeInvested,
      currentValue,
      totalReturnPercentage,
      totalHoldings: bnToNumber(cumulativeUnitsBn),
      numberOfPurchases,
    },
    timeline,
  };
}

const PORTFOLIO_WEIGHT_SUM_TOLERANCE = new BigNumber('1e-6');

function findFirstPriceOnOrAfter(
  prices: PricePoint[],
  fromUtcMidnight: number,
  endUtcMidnight: number,
): PricePoint | null {
  for (const p of prices) {
    const d = toUtcMidnightEpochMs(p.date);
    if (d < fromUtcMidnight) continue;
    if (d > endUtcMidnight) return null;
    if (isFiniteNumber(p.close) && p.close > 0) return p;
  }
  return null;
}

function closeOnOrBeforeDay(prices: PricePoint[], dayUtcMidnight: number): number | null {
  let close: number | null = null;
  for (const p of prices) {
    const d = toUtcMidnightEpochMs(p.date);
    if (d > dayUtcMidnight) break;
    if (isFiniteNumber(p.close) && p.close > 0) close = p.close;
  }
  return close;
}

function lastCloseInRange(
  prices: PricePoint[],
  startUtc: number,
  endUtc: number,
): PricePoint | null {
  let best: PricePoint | null = null;
  for (const p of prices) {
    const d = toUtcMidnightEpochMs(p.date);
    if (d >= startUtc && d <= endUtc && isFiniteNumber(p.close) && p.close > 0) {
      best = p;
    }
  }
  return best;
}

/**
 * Multi-asset DCA: each period invests `totalAmount` split by weight (%).
 * Each leg uses the same scheduling as single-asset (first price on/after scheduled buy, UTC day).
 *
 * @see doc/developer-tasks.md L2-BE-2 · requirements §2.3 Level 2
 */
export function runPortfolioDcaBacktest(
  seriesBySymbol: Record<string, PricePoint[]>,
  params: RunPortfolioDcaBacktestParams,
): RunPortfolioDcaBacktestResult {
  const { assets, frequency } = params;

  if (!isFiniteNumber(params.startDate) || !isFiniteNumber(params.endDate)) {
    throw new BadRequestException('startDate and endDate must be epoch milliseconds.');
  }

  const startDate = toUtcMidnightEpochMs(params.startDate);
  const endDate = toUtcMidnightEpochMs(params.endDate);

  if (endDate < startDate) {
    throw new BadRequestException('endDate must be after startDate.');
  }

  if (!assets?.length) {
    throw new BadRequestException('Portfolio must include at least one asset.');
  }

  const seenSym = new Set<string>();
  let weightSum = new BigNumber(0);
  const normalizedAssets: PortfolioAssetWeight[] = [];

  for (const a of assets) {
    const sym = a.symbol.toUpperCase();
    if (seenSym.has(sym)) {
      throw new BadRequestException(`Duplicate symbol in portfolio: ${sym}`);
    }
    seenSym.add(sym);
    if (!isFiniteNumber(a.weight) || a.weight <= 0) {
      throw new BadRequestException(`Weight for ${sym} must be a positive number.`);
    }
    weightSum = weightSum.plus(a.weight);
    normalizedAssets.push({ symbol: sym, weight: a.weight });
  }

  if (weightSum.minus(100).abs().isGreaterThan(PORTFOLIO_WEIGHT_SUM_TOLERANCE)) {
    throw new BadRequestException('Asset weights must sum to 100%.');
  }

  if (!isFiniteNumber(params.totalAmount) || params.totalAmount <= 0) {
    throw new BadRequestException('totalAmount must be a positive number.');
  }

  const upperSeries: Record<string, PricePoint[]> = {};
  for (const [k, v] of Object.entries(seriesBySymbol)) {
    upperSeries[k.toUpperCase()] = v;
  }

  for (const { symbol } of normalizedAssets) {
    const s = upperSeries[symbol];
    if (!Array.isArray(s) || s.length === 0) {
      throw new BadRequestException(`Price series missing or empty for ${symbol}.`);
    }
  }

  const totalAmountBn = new BigNumber(params.totalAmount);
  const unitsBn: Record<string, BigNumber> = {};
  const investedBn: Record<string, BigNumber> = {};
  for (const { symbol } of normalizedAssets) {
    unitsBn[symbol] = new BigNumber(0);
    investedBn[symbol] = new BigNumber(0);
  }

  let totalInvestedBn = new BigNumber(0);
  let numberOfPurchases = 0;
  const timeline: PortfolioBacktestTimelinePoint[] = [];

  let nextBuy = startDate;

  while (nextBuy <= endDate) {
    const scheduled = nextBuy;
    const legs: { symbol: string; point: PricePoint; amountBn: BigNumber }[] = [];
    let markDate = scheduled;

    for (const { symbol, weight } of normalizedAssets) {
      const series = upperSeries[symbol];
      const pt = findFirstPriceOnOrAfter(series, scheduled, endDate);
      if (!pt) {
        throw new BadRequestException(
          `No price on or after buy date for ${symbol} within the backtest range.`,
        );
      }
      const d = toUtcMidnightEpochMs(pt.date);
      if (d > markDate) markDate = d;

      const amountForLeg = totalAmountBn.multipliedBy(weight).dividedBy(100);
      legs.push({ symbol, point: pt, amountBn: amountForLeg });
    }

    for (const { symbol, point, amountBn: amt } of legs) {
      const closeBn = new BigNumber(point.close);
      const bought = amt.dividedBy(closeBn);
      unitsBn[symbol] = unitsBn[symbol].plus(bought);
      investedBn[symbol] = investedBn[symbol].plus(amt);
      totalInvestedBn = totalInvestedBn.plus(amt);
    }
    numberOfPurchases += 1;

    let portfolioValueBn = new BigNumber(0);
    const slices: PortfolioTimelineAssetSlice[] = [];

    for (const { symbol } of normalizedAssets) {
      const closeVal = closeOnOrBeforeDay(upperSeries[symbol], markDate);
      if (closeVal === null) {
        throw new BadRequestException(`No price to value ${symbol} on or before execution date.`);
      }
      const closeBn = new BigNumber(closeVal);
      const valueBn = unitsBn[symbol].multipliedBy(closeBn);
      portfolioValueBn = portfolioValueBn.plus(valueBn);
      slices.push({
        symbol,
        units: bnToNumber(unitsBn[symbol]),
        value: bnToNumber(valueBn),
        invested: bnToNumber(investedBn[symbol]),
      });
    }

    timeline.push({
      date: markDate,
      portfolioValue: bnToNumber(portfolioValueBn),
      cumulativeInvested: bnToNumber(totalInvestedBn),
      assets: slices,
    });

    nextBuy = nextBuyDateEpochMs(scheduled, frequency);
  }

  let finalValueBn = new BigNumber(0);
  const breakdown: PortfolioAssetBreakdown[] = [];

  for (const { symbol, weight } of normalizedAssets) {
    const lastPt = lastCloseInRange(upperSeries[symbol], startDate, endDate);
    if (!lastPt) {
      throw new BadRequestException(`No usable price points in range for ${symbol}.`);
    }
    const closeBn = new BigNumber(lastPt.close);
    const curVBn = unitsBn[symbol].multipliedBy(closeBn);
    finalValueBn = finalValueBn.plus(curVBn);
    const inv = investedBn[symbol];
    const retPct = inv.isZero()
      ? new BigNumber(0)
      : curVBn.minus(inv).dividedBy(inv).multipliedBy(100);
    breakdown.push({
      symbol,
      weight,
      totalUnits: bnToNumber(unitsBn[symbol]),
      invested: bnToNumber(inv),
      currentValue: bnToNumber(curVBn),
      returnPercentage: bnToNumber(retPct),
    });
  }

  const totalReturnPercentage = totalInvestedBn.isZero()
    ? 0
    : bnToNumber(
        finalValueBn.minus(totalInvestedBn).dividedBy(totalInvestedBn).multipliedBy(100),
      );

  return {
    summary: {
      totalInvested: bnToNumber(totalInvestedBn),
      currentValue: bnToNumber(finalValueBn),
      totalReturnPercentage,
      numberOfPurchases,
      assets: breakdown,
    },
    timeline,
  };
}

@Injectable()
export class CalculationService {
  runSingleAssetDcaBacktest(prices: PricePoint[], params: RunDcaBacktestParams) {
    return runSingleAssetDcaBacktest(prices, params);
  }

  runPortfolioDcaBacktest(
    seriesBySymbol: Record<string, PricePoint[]>,
    params: RunPortfolioDcaBacktestParams,
  ) {
    return runPortfolioDcaBacktest(seriesBySymbol, params);
  }
}
