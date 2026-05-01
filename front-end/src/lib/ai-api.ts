import { apiClient } from "@/lib/api-client";
import type { BacktestSummary, BacktestTrade } from "@/lib/backtest-api";

// ── Request shape — must match backend AnalyzeAiDto exactly ─────────────────

interface BacktestContextSnapshot {
    mode: "single" | "portfolio";
    title: string;
    /** ISO timestamp string */
    generatedAt: string;
    summary: {
        totalInvested: number;
        currentValue: number;
        totalReturnPercentage: number;
        realizedProfit?: number;
        unrealizedValue?: number;
    };
    trades?: Array<{
        date: string;
        type: string;
        price: number;
        profit?: number;
    }>;
    timelineSample?: Array<{ date: string; value: number }>;
}

export interface AiAnalyzeRequest {
    userQuery: string;
    backtestContext?: BacktestContextSnapshot;
}

// ── Response shape ───────────────────────────────────────────────────────────

export interface AiAnalyzeResponse {
    advice: string;
    /** Plain-text labels returned by backend, e.g. "Compare weekly vs monthly" */
    suggestedActions?: string[];
}

/**
 * UI chip shape — parsed from the plain string labels the backend returns.
 */
export interface SuggestedAction {
    label: string;
    field: "frequency" | "amount" | "startDate" | "endDate" | "symbol";
    value: string | number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function epochToIso(epochMs: number): string {
    return new Date(epochMs).toISOString();
}

/**
 * Build the backtestContext snapshot the backend DTO expects.
 */
export function buildBacktestContext(
    summary: BacktestSummary,
    trades?: BacktestTrade[],
    config?: {
        symbol?: string;
        amount?: number;
        frequency?: string;
        startDate?: number;
        endDate?: number;
    },
): BacktestContextSnapshot {
    const symbol = config?.symbol ?? "Asset";
    return {
        mode: "single",
        title: `Single-asset DCA Backtest (${symbol})`,
        generatedAt: new Date().toISOString(),
        summary: {
            totalInvested: summary.totalInvested,
            currentValue: summary.currentValue,
            totalReturnPercentage: summary.totalReturnPercentage,
            realizedProfit: summary.realizedProfit,
            unrealizedValue: summary.unrealizedValue,
        },
        trades: trades?.slice(0, 10).map((t) => ({
            date: epochToIso(t.date),
            type: t.type === "takeProfit" ? "TAKE_PROFIT" : "STOP_LOSS",
            price: t.price,
            profit: t.profit,
        })),
    };
}

/**
 * Parse a plain-text action string from the backend into a typed chip.
 */
export function parseActionLabel(label: string): SuggestedAction {
    const lower = label.toLowerCase();
    if (lower.includes("weekly")) return { label, field: "frequency", value: "weekly" };
    if (lower.includes("monthly")) return { label, field: "frequency", value: "monthly" };
    if (lower.includes("daily")) return { label, field: "frequency", value: "daily" };
    const amountMatch = lower.match(/\$(\d+)/);
    if (amountMatch) return { label, field: "amount", value: Number(amountMatch[1]) };
    return { label, field: "frequency", value: "weekly" };
}

// ── API call ─────────────────────────────────────────────────────────────────

export async function analyzeBacktest(
    body: AiAnalyzeRequest,
): Promise<AiAnalyzeResponse> {
    return apiClient<AiAnalyzeResponse>("/ai/analyze", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
