import { apiClient } from "@/lib/api-client"

export type DcaFrequency = "daily" | "weekly" | "monthly"

export interface RunBacktestRequestBody {
  symbol: string
  amount: number
  frequency: DcaFrequency
  startDate: number
  endDate: number
}

export interface BacktestSummary {
  totalInvested: number
  currentValue: number
  totalReturnPercentage: number
  totalHoldings: number
  numberOfPurchases: number
}

export interface BacktestTimelinePoint {
  date: number
  close: number
  unitsBought: number
  cumulativeUnits: number
  cumulativeInvested: number
  portfolioValue: number
}

export interface RunBacktestResponse {
  summary: BacktestSummary
  timeline: BacktestTimelinePoint[]
}

export async function runBacktest(body: RunBacktestRequestBody): Promise<RunBacktestResponse> {
  return apiClient<RunBacktestResponse>("/backtest/run", {
    method: "POST",
    body: JSON.stringify(body),
  })
}
