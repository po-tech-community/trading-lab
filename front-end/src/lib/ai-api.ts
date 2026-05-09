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
        mode?: "single" | "portfolio";
        symbol?: string;
        amount?: number;
        frequency?: string;
        startDate?: number;
        endDate?: number;
        assets?: Array<{ symbol: string; weight: number }>;
    },
): BacktestContextSnapshot {
    const mode = config?.mode ?? "single";
    const title =
        mode === "portfolio"
            ? `Portfolio DCA Backtest (${(config?.assets ?? []).map((a) => a.symbol).join(", ") || "multi-asset"})`
            : `Single-asset DCA Backtest (${config?.symbol ?? "Asset"})`;

    return {
        mode,
        title,
        generatedAt: new Date().toISOString(),
        summary: {
            totalInvested: summary.totalInvested,
            currentValue: summary.currentValue,
            totalReturnPercentage: summary.totalReturnPercentage,
            realizedProfit: summary.realizedProfit,
            unrealizedValue: summary.unrealizedValue,
        },
        assets: config?.assets,
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

// ── MCP Inspect / Execute types ───────────────────────────────────────────────

export interface McpPlannedTool {
    providerId: string;
    providerName: string;
    toolName: string;
    title?: string;
    description?: string;
    readOnly: boolean;
    destructive: boolean;
    input: Record<string, unknown>;
}

export interface McpInspectResponse {
    trace: Record<string, unknown>;
    plannedTools: McpPlannedTool[];
}

export interface McpEvidence {
    source: "mcp";
    providerId: string;
    providerName: string;
    toolName: string;
    title?: string;
    status: "executed" | "failed";
    input: Record<string, unknown>;
    summary: string;
    structuredContent?: Record<string, unknown>;
    error?: string;
}

export interface AiAnalyzeFullResponse extends AiAnalyzeResponse {
    evidence?: McpEvidence[];
}

export interface McpExecuteRequest {
    userQuery: string;
    backtestContext?: BacktestContextSnapshot;
    approvedTools: Array<{ providerId: string; toolName: string }>;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function analyzeBacktest(
    body: AiAnalyzeRequest,
): Promise<AiAnalyzeResponse> {
    return apiClient<AiAnalyzeResponse>("/ai/analyze", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function mcpInspect(
    body: AiAnalyzeRequest,
): Promise<McpInspectResponse> {
    return apiClient<McpInspectResponse>("/ai/mcp/inspect", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function mcpExecute(
    body: McpExecuteRequest,
): Promise<AiAnalyzeFullResponse> {
    return apiClient<AiAnalyzeFullResponse>("/ai/mcp/execute", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

// ── Evidence → ResultCard adapters ────────────────────────────────────────────

type RiskLevel = "low" | "medium" | "high";

function toRiskLevel(value: unknown, fallback: RiskLevel = "medium"): RiskLevel {
    const s = String(value ?? "").toLowerCase();
    if (s === "low" || s === "high" || s === "medium") return s;
    if (s.includes("high") || s.includes("extreme")) return "high";
    if (s.includes("low") || s.includes("minimal")) return "low";
    return fallback;
}

/**
 * Convert BE evidence[] into result card props.
 * Returns undefined if no evidence maps to a card.
 */
export function evidenceToCards(evidence: McpEvidence[]): {
    marketSnapshot?: import("@/components/mcp/ResultCards").MarketSnapshotData;
    riskCheck?: import("@/components/mcp/ResultCards").RiskCheckData;
    allocationDiagnostics?: import("@/components/mcp/ResultCards").AllocationDiagnosticsData;
} | undefined {
    const cards: ReturnType<typeof evidenceToCards> = {};

    for (const e of evidence) {
        if (e.status !== "executed" || !e.structuredContent) continue;
        const s = e.structuredContent;

        if (e.toolName === "get_latest_quote") {
            cards.marketSnapshot = {
                symbol: String(s.symbol ?? ""),
                price: Number(s.priceUsd ?? 0),
                change: 0,
                changePercent: Number(s.change24hPercent ?? 0),
                volume: 0,
                marketCap: 0,
                peRatio: 0,
                dividendYield: 0,
            };
        }

        if (e.toolName === "evaluate_risk_profile") {
            cards.riskCheck = {
                ...(cards.riskCheck ?? { sharpeRatio: 0, beta: 0, var95: 0, volatility: 0 }),
                overallRisk: toRiskLevel(s.riskLevel),
                maxDrawdown: -Math.abs(Number(s.sampledDrawdownPercent ?? 0)),
                stressTestResult: e.summary,
            };
        }

        if (e.toolName === "get_volatility_summary") {
            cards.riskCheck = {
                ...(cards.riskCheck ?? { sharpeRatio: 0, beta: 0, var95: 0, maxDrawdown: 0, stressTestResult: e.summary }),
                overallRisk: toRiskLevel(s.regime),
                volatility: Number(s.annualizedVolatility ?? 0),
            };
        }

        if (e.toolName === "get_drawdown_breakdown") {
            cards.riskCheck = {
                ...(cards.riskCheck ?? { sharpeRatio: 0, beta: 0, var95: 0, volatility: 0, stressTestResult: e.summary }),
                overallRisk: cards.riskCheck?.overallRisk ?? "medium",
                maxDrawdown: -Math.abs(Number(s.portfolioMaxDrawdownPercent ?? 0)),
            };
        }

        if (e.toolName === "get_concentration_risk") {
            const largest = (s.largestPosition ?? {}) as Record<string, unknown>;
            const sym = String(largest.symbol ?? "");
            const weight = Number(largest.weight ?? 0);
            cards.allocationDiagnostics = {
                currentAllocation: sym ? { [sym]: weight } : {},
                targetAllocation: {},
                rebalanceNeeded: toRiskLevel(s.riskLevel) === "high",
                driftAmount: 0,
                suggestedTrades: [],
            };
        }

        if (e.toolName === "get_asset_contribution") {
            const rows = Array.isArray(s.rows) ? s.rows as Record<string, unknown>[] : [];
            const currentAllocation: Record<string, number> = {};
            rows.forEach((r) => {
                if (r.symbol) currentAllocation[String(r.symbol)] = Number(r.returnPercent ?? 0);
            });
            cards.allocationDiagnostics = {
                currentAllocation,
                targetAllocation: {},
                rebalanceNeeded: false,
                driftAmount: 0,
                suggestedTrades: [],
            };
        }
    }

    return Object.keys(cards).length > 0 ? cards : undefined;
}
