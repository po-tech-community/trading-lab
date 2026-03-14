/** One data point in the trajectory chart */
export interface ChartDataPoint {
  date: string
  invested: number
  value: number
}

/**
 * Mock time-series data for the DCA backtest chart.
 * Each point: date, cumulative invested, portfolio value.
 * Replace with API data when backend is ready.
 */
export const MOCK_CHART_DATA: ChartDataPoint[] = [
  { date: "2023-01-01", invested: 100, value: 100 },
  { date: "2023-02-01", invested: 200, value: 195 },
  { date: "2023-03-01", invested: 300, value: 340 },
  { date: "2023-04-01", invested: 400, value: 480 },
  { date: "2023-05-01", invested: 500, value: 460 },
  { date: "2023-06-01", invested: 600, value: 750 },
  { date: "2023-07-01", invested: 700, value: 920 },
  { date: "2023-08-01", invested: 800, value: 1050 },
  { date: "2023-09-01", invested: 900, value: 980 },
  { date: "2023-10-01", invested: 1000, value: 1250 },
  { date: "2023-11-01", invested: 1100, value: 1600 },
  { date: "2023-12-01", invested: 1200, value: 2150 },
]
