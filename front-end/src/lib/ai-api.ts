import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
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
    assets?: Array<{ symbol: string; weight: number }>;
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
    evidence?: McpEvidence[];
}

/**
 * UI chip shape — parsed from the plain string labels the backend returns.
 * `null` means the label is a query/comparison that should be sent to AI chat,
 * not applied directly to the form.
 */
export interface SuggestedAction {
    label: string;
    field: "frequency" | "amount" | "startDate" | "endDate" | "symbol"
         | "stopLossThreshold" | "stopLossSellPercent" | "stopLossEnabled"
         | "takeProfitThreshold" | "takeProfitSellPercent" | "takeProfitEnabled";
    value: string | number | boolean;
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
 * Parse a plain-text action label into a typed form action.
 * Returns null for comparison/relative/ambiguous labels — those should be sent
 * to the AI as a chat message rather than applied to the form.
 */
export function parseActionLabel(label: string): SuggestedAction | null {
    const lower = label.toLowerCase();

    // Comparisons, relative changes, and open-ended queries → chat only
    if (lower.includes(" vs ") || lower.includes("compare")) return null;
    if (/\b(lower|reduce|increase|raise|decrease|adjust)\b.*\bby\b/i.test(lower)) return null;

    // Frequency — only when a single value is clearly stated
    const hasWeekly = lower.includes("weekly");
    const hasMonthly = lower.includes("monthly");
    const hasDaily = lower.includes("daily");
    if (hasWeekly && !hasMonthly && !hasDaily) return { label, field: "frequency", value: "weekly" };
    if (hasMonthly && !hasWeekly && !hasDaily) return { label, field: "frequency", value: "monthly" };
    if (hasDaily && !hasWeekly && !hasMonthly) return { label, field: "frequency", value: "daily" };

    // Amount — explicit dollar value
    const amountMatch = lower.match(/\$(\d+(?:\.\d+)?)/);
    if (amountMatch) return { label, field: "amount", value: Number(amountMatch[1]) };

    // Symbol
    if (/\b(btc|bitcoin)\b/.test(lower)) return { label, field: "symbol", value: "BTC" };
    if (/\b(eth|ethereum)\b/.test(lower)) return { label, field: "symbol", value: "ETH" };
    if (/\baapl\b/.test(lower)) return { label, field: "symbol", value: "AAPL" };
    if (/\btsla\b/.test(lower)) return { label, field: "symbol", value: "TSLA" };

    // Stop-loss / take-profit — explicit numeric threshold
    const slMatch = lower.match(/stop.?loss.*?(\d+(?:\.\d+)?)\s*%/);
    if (slMatch) return { label, field: "stopLossThreshold", value: Number(slMatch[1]) };
    const tpMatch = lower.match(/take.?profit.*?(\d+(?:\.\d+)?)\s*%/);
    if (tpMatch) return { label, field: "takeProfitThreshold", value: Number(tpMatch[1]) };

    // No clear mapping — treat as a chat query
    return null;
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

export type AiAnalyzeFullResponse = AiAnalyzeResponse;

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

/**
 * Streams AI advice tokens from GET /ai/analyze/stream via Server-Sent Events.
 *
 * Calls `onMeta` once with suggestedActions/evidence/mcp before tokens arrive,
 * then calls `onToken` for each incremental text chunk, and `onDone` when the
 * stream closes normally. `onError` is called on any error event or network failure.
 *
 * Returns a cleanup function — call it to abort the stream early.
 */
export function analyzeBacktestStream(
    body: AiAnalyzeRequest,
    callbacks: {
        onMeta?: (meta: {
            suggestedActions?: string[];
            evidence?: AiAnalyzeFullResponse["evidence"];
            mcp?: Record<string, unknown>;
        }) => void;
        onToken: (token: string) => void;
        onDone?: () => void;
        onError?: (message: string) => void;
    },
): () => void {
    const BASE_URL = env.apiUrl;
    const token = localStorage.getItem("accessToken");

    const payload = encodeURIComponent(JSON.stringify(body));
    const url = `${BASE_URL}/ai/analyze/stream?payload=${payload}`;

    const controller = new AbortController();

    // EventSource doesn't support Authorization headers — we use fetch+ReadableStream instead.
    void (async () => {
        try {
            const res = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "text/event-stream",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                callbacks.onError?.(`Stream request failed: ${res.status} ${res.statusText}`);
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // SSE lines are separated by \n\n
                const parts = buffer.split("\n\n");
                buffer = parts.pop() ?? ""; // keep incomplete last chunk

                for (const part of parts) {
                    const line = part.trim();
                    if (!line.startsWith("data:")) continue;
                    const raw = line.slice(5).trim();

                    if (raw === "[DONE]") {
                        callbacks.onDone?.();
                        return;
                    }

                    try {
                        const parsed = JSON.parse(raw) as {
                            token?: string;
                            meta?: Parameters<NonNullable<typeof callbacks.onMeta>>[0];
                            error?: string;
                        };

                        if (parsed.error) {
                            callbacks.onError?.(parsed.error);
                            return;
                        }
                        if (parsed.meta) {
                            callbacks.onMeta?.(parsed.meta);
                        }
                        if (parsed.token !== undefined) {
                            callbacks.onToken(parsed.token);
                        }
                    } catch {
                        // malformed SSE data line — skip
                    }
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            callbacks.onError?.(err instanceof Error ? err.message : "Stream connection failed");
        }
    })();

    return () => controller.abort();
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