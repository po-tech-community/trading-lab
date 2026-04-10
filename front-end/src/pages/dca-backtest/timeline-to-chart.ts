import type { BacktestTimelinePoint, PortfolioBacktestTimelinePoint } from "@/lib/backtest-api";
import type { ChartDataPoint } from "./constants";

/** Maps API timeline points (single-asset or portfolio) to chart series (date as YYYY-MM-DD for the X axis). */
export function timelineToChartData(
  timeline: Array<BacktestTimelinePoint | PortfolioBacktestTimelinePoint>,
): ChartDataPoint[] {
  return timeline.map((p) => ({
    date: new Date(p.date).toISOString().slice(0, 10),
    invested: (p as any).cumulativeInvested ?? 0,
    value: (p as any).portfolioValue ?? 0,
    // Portfolio points don't include a single-asset close price
    close: (p as any).close ?? 0,
  }));
}
