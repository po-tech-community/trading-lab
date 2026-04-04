import type { BacktestTimelinePoint } from "@/lib/backtest-api";
import type { ChartDataPoint } from "./constants";

/** Maps API timeline points to chart series (date as YYYY-MM-DD for the X axis). */
export function timelineToChartData(
  timeline: BacktestTimelinePoint[],
): ChartDataPoint[] {
  return timeline.map((p) => ({
    date: new Date(p.date).toISOString().slice(0, 10),
    invested: p.cumulativeInvested,
    value: p.portfolioValue,
    close: p.close,
  }));
}
