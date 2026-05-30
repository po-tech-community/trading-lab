import { apiClient } from "@/lib/api-client";
import type { BacktestSummary, BacktestTrade } from "@/lib/backtest-api";

export interface BacktestHistoryEntry {
  _id: string;
  mode: "single" | "portfolio";
  label: string;
  summary: BacktestSummary;
  trades: BacktestTrade[];
  config?: {
    symbol?: string;
    assets?: Array<{ symbol: string; weight: number }>;
    frequency?: string;
    amount?: number;
  };
  createdAt: string;
}

export interface SaveBacktestHistoryBody {
  mode: "single" | "portfolio";
  label: string;
  summary: BacktestSummary;
  trades?: BacktestTrade[];
  config?: Record<string, unknown>;
}

export function saveBacktestHistory(body: SaveBacktestHistoryBody): Promise<BacktestHistoryEntry> {
  return apiClient<BacktestHistoryEntry>("/backtest/history", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listBacktestHistory(): Promise<BacktestHistoryEntry[]> {
  return apiClient<BacktestHistoryEntry[]>("/backtest/history");
}

export function deleteBacktestHistory(id: string): Promise<void> {
  return apiClient<void>(`/backtest/history/${id}`, { method: "DELETE" });
}
