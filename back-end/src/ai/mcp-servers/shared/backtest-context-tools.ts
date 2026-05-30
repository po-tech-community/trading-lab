type BacktestMode = 'single' | 'portfolio';

export interface BacktestContextSummary {
  totalInvested: number;
  currentValue: number;
  totalReturnPercentage: number;
  realizedProfit?: number;
  unrealizedValue?: number;
}

export interface BacktestContextTrade {
  date: string;
  type: string;
  price: number;
  profit?: number;
}

export interface BacktestContextTimelinePoint {
  date: string;
  value: number;
}

export interface BacktestContextSnapshot {
  mode: BacktestMode;
  title: string;
  generatedAt: string;
  summary: BacktestContextSummary;
  trades?: BacktestContextTrade[];
  timelineSample?: BacktestContextTimelinePoint[];
}

export function buildBacktestSummary(context: BacktestContextSnapshot) {
  const summary = context.summary;
  const profitState =
    summary.totalReturnPercentage > 0
      ? 'gain'
      : summary.totalReturnPercentage < 0
        ? 'loss'
        : 'flat';

  return {
    mode: context.mode,
    title: context.title,
    generatedAt: context.generatedAt,
    totalInvested: summary.totalInvested,
    currentValue: summary.currentValue,
    totalReturnPercentage: summary.totalReturnPercentage,
    realizedProfit: summary.realizedProfit ?? null,
    unrealizedValue: summary.unrealizedValue ?? null,
    tradeCount: context.trades?.length ?? 0,
    profitState,
  };
}

export function summarizeTradeHistory(context: BacktestContextSnapshot) {
  const trades = context.trades ?? [];
  const realizedTrades = trades.filter(
    (trade) => typeof trade.profit === 'number',
  );
  const totalRealizedProfit = Number(
    realizedTrades
      .reduce((sum, trade) => sum + (trade.profit ?? 0), 0)
      .toFixed(2),
  );
  const wins = realizedTrades.filter((trade) => (trade.profit ?? 0) > 0).length;
  const losses = realizedTrades.filter((trade) => (trade.profit ?? 0) < 0).length;
  const largestWin =
    realizedTrades.reduce((max, trade) => {
      const profit = trade.profit ?? Number.NEGATIVE_INFINITY;
      return profit > max ? profit : max;
    }, Number.NEGATIVE_INFINITY) || 0;
  const largestLoss =
    realizedTrades.reduce((min, trade) => {
      const profit = trade.profit ?? Number.POSITIVE_INFINITY;
      return profit < min ? profit : min;
    }, Number.POSITIVE_INFINITY) || 0;

  return {
    tradeCount: trades.length,
    realizedTradeCount: realizedTrades.length,
    wins,
    losses,
    totalRealizedProfit,
    largestWin: Number.isFinite(largestWin) ? Number(largestWin.toFixed(2)) : 0,
    largestLoss: Number.isFinite(largestLoss)
      ? Number(largestLoss.toFixed(2))
      : 0,
    latestTrades: trades.slice(-3),
  };
}

export function evaluateRiskProfile(context: BacktestContextSnapshot) {
  const summary = context.summary;
  const timelineSample = context.timelineSample ?? [];
  const values = timelineSample.map((point) => point.value);
  const peak = values.length > 0 ? Math.max(...values) : summary.currentValue;
  const trough = values.length > 0 ? Math.min(...values) : summary.currentValue;
  const sampledDrawdownPercent =
    peak > 0 ? Number((((peak - trough) / peak) * 100).toFixed(2)) : 0;
  const negativeReturn = summary.totalReturnPercentage < 0;
  const realizedLoss = (summary.realizedProfit ?? 0) < 0;
  const riskLevel =
    sampledDrawdownPercent >= 20 || summary.totalReturnPercentage <= -15
      ? 'high'
      : sampledDrawdownPercent >= 10 || negativeReturn || realizedLoss
        ? 'medium'
        : 'low';

  return {
    riskLevel,
    sampledDrawdownPercent,
    realizedProfit: summary.realizedProfit ?? null,
    unrealizedValue: summary.unrealizedValue ?? null,
    signals: [
      negativeReturn ? 'negative_total_return' : 'positive_or_flat_total_return',
      sampledDrawdownPercent >= 10
        ? 'elevated_sample_drawdown'
        : 'contained_sample_drawdown',
      realizedLoss ? 'realized_losses_present' : 'no_realized_loss_signal',
    ],
  };
}

