import { apiClient } from "@/lib/api-client";

export type DcaFrequency = "daily" | "weekly" | "monthly";

export interface RunBacktestRequestBody {
  symbol: string;
  amount: number;
  frequency: DcaFrequency;
  startDate: number;
  endDate: number;
  triggers?: {
    takeProfit?: { threshold: number; sellAction: number };
    stopLoss?: { threshold: number; sellAction: number };
  };
}

export interface BacktestSummary {
  totalInvested: number;
  currentValue: number;
  totalReturnPercentage: number;
  totalHoldings: number;
  numberOfPurchases: number;
  realizedProfit: number;
  unrealizedValue: number;
}

export interface BacktestTimelinePoint {
  date: number;
  close: number;
  unitsBought: number;
  cumulativeUnits: number;
  cumulativeInvested: number;
  portfolioValue: number;
}

export interface BacktestTrade {
  date: number;
  type: 'takeProfit' | 'stopLoss';
  price: number;
  units: number;
  profit: number;
  sellAction: number;
}

export interface RunBacktestResponse {
  summary: BacktestSummary;
  timeline: BacktestTimelinePoint[];
  trades: BacktestTrade[];
}

export async function runBacktest(
  body: RunBacktestRequestBody,
): Promise<RunBacktestResponse> {
  return apiClient<RunBacktestResponse>("/backtest/run", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Portfolio backtest (L2-FE-1 / L2-BE-3) ───────────────────────────────────

export interface PortfolioAsset {
  symbol: string;
  /** Allocation weight as a whole number (e.g. 60 = 60%). Must sum to 100 across all assets. */
  weight: number;
}

export interface RunPortfolioBacktestRequestBody {
  assets: PortfolioAsset[];
  totalAmount: number;
  frequency: DcaFrequency;
  startDate: number;
  endDate: number;
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

export interface PortfolioAssetBreakdown {
  symbol: string;
  weight: number;
  totalUnits: number;
  invested: number;
  currentValue: number;
  returnPercentage: number;
}

export interface PortfolioBacktestSummary {
  totalInvested: number;
  currentValue: number;
  totalReturnPercentage: number;
  numberOfPurchases: number;
  assets: PortfolioAssetBreakdown[];
}

export interface RunPortfolioBacktestResponse {
  summary: PortfolioBacktestSummary;
  timeline: PortfolioBacktestTimelinePoint[];
}

export async function runPortfolioBacktest(
  body: RunPortfolioBacktestRequestBody,
): Promise<RunPortfolioBacktestResponse> {
  return apiClient<RunPortfolioBacktestResponse>("/backtest/portfolio", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
