import { forwardRef, useCallback } from "react";
import type { ForwardedRef, KeyboardEvent } from "react";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { McpExecutionPanel } from "@/components/mcp/McpExecutionPanel";
import {
  MarketSnapshotCard,
  RiskCheckCard,
  AllocationDiagnosticsCard,
  type AllocationDiagnosticsData,
} from "@/components/mcp/ResultCards";
import { MarkdownContent } from "@/components/ai/MarkdownContent";
import type { ChatMessage } from "@/hooks/use-mcp-chat";
import { MarkdownContent } from "@/components/ui/MarkdownContent";

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onMcpApprove?: (id: string) => void;
  onMcpDeny?: (id: string) => void;
  isSending?: boolean;
}

// AI-FE-6: localStorage key shared with the (mock) Market Data watchlist surface.
const WATCHLIST_STORAGE_KEY = "tradingLab.watchlist";

function readWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeWatchlist(symbols: string[]) {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(symbols));
  } catch {
    // localStorage may be unavailable (private mode); the toast still gives feedback.
  }
}

function summariseTrades(data: AllocationDiagnosticsData): string {
  const buys = data.suggestedTrades.filter((t) => t.action === "buy").length;
  const sells = data.suggestedTrades.filter((t) => t.action === "sell").length;
  const parts: string[] = [];
  if (buys) parts.push(`${buys} buy${buys === 1 ? "" : "s"}`);
  if (sells) parts.push(`${sells} sell${sells === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" / ") : "no trades";
}

/**
 * Right-hand chat panel for the AI Advisor:
 * - Small header with avatar and status.
 * - Scrollable message list.
 * - Single-line text input with send button.
 *
 * Per AI-FE-5 the AI message body now uses the shared `MarkdownContent`
 * renderer (bold, italic, headings, lists, inline code) instead of plain text.
 *
 * Per AI-FE-6 the six result-card action buttons are wired to real navigation
 * and toast feedback (previously `console.log` stubs).
 */
export const ChatPanel = forwardRef<HTMLDivElement, ChatPanelProps>(
  (
    { messages, input, onInputChange, onSend, onMcpApprove, onMcpDeny, isSending = false },
    scrollRef: ForwardedRef<HTMLDivElement>,
  ) => {
    const navigate = useNavigate();

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSend();
      }
    };

    // ── AI-FE-6: ResultCard action handlers ─────────────────────────────────
    // Pattern: every action shows a `toast` so the user gets immediate feedback,
    // then (where appropriate) navigates to the page that owns the underlying
    // data so they can drill down or apply the suggestion.

    const handleViewMarketDetails = useCallback(
      (symbol: string) => {
        toast.info(`Opening market data for ${symbol}…`);
        navigate("/home/market");
      },
      [navigate],
    );

    const handleAddToWatchlist = useCallback((symbol: string) => {
      const current = readWatchlist();
      if (current.includes(symbol)) {
        toast(`${symbol} is already in your watchlist.`);
        return;
      }
      writeWatchlist([...current, symbol]);
      toast.success(`Added ${symbol} to your watchlist.`);
    }, []);

    const handleViewRiskReport = useCallback(() => {
      toast.info("Opening the latest backtest results to inspect risk metrics.");
      navigate("/home/backtest");
    }, [navigate]);

    const handleAdjustStrategy = useCallback(() => {
      toast.info("Adjust your DCA frequency, amount, or TP/SL triggers below.");
      navigate("/home/backtest");
    }, [navigate]);

    const handleRebalance = useCallback(
      (data: AllocationDiagnosticsData) => {
        toast.success(`Opening portfolio config — ${summariseTrades(data)} suggested.`);
        navigate("/home/portfolio");
      },
      [navigate],
    );

    const handleViewAllocation = useCallback(() => {
      toast.info("Opening your portfolio allocation chart.");
      navigate("/home/portfolio");
    }, [navigate]);

    return (
      <Card className="flex-1 flex flex-col overflow-hidden relative gap-0 py-0">
        {/* Panel header */}
        <div className="p-6 border-b flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Bot className="size-8" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight">
                AI advisor
              </h3>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 relative"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3 max-w-[70%]",
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "",
              )}
            >
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center shrink-0 border",
                  msg.sender === "ai"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {msg.sender === "ai" ? (
                  <Bot className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    msg.sender === "ai"
                      ? "bg-card border text-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
<<<<<<< HEAD
                  {msg.sender === "ai" ? (
                    // AI-FE-5: render assistant replies as markdown.
                    <MarkdownContent text={msg.text} />
                  ) : (
                    // User messages stay as plain text (preserves whitespace).
                    <p className="whitespace-pre-wrap">{msg.text}</p>
=======
                  {/* AI-FE-5: render AI messages as markdown, user messages as plain text */}
                  {msg.sender === "ai" ? (
                    <MarkdownContent text={msg.text} />
                  ) : (
                    msg.text
>>>>>>> 8885c28 (fix: AI-FE-5 — markdown rendering across all AI chat surfaces)
                  )}
                </div>

                {msg.mcpExecution && (
                  <McpExecutionPanel
                    execution={msg.mcpExecution}
                    onApprove={onMcpApprove || (() => {})}
                    onDeny={onMcpDeny || (() => {})}
                    className="max-w-none"
                  />
                )}

                {msg.resultCards && (
                  <div className="space-y-3">
                    {msg.resultCards.marketSnapshot && (
                      <MarketSnapshotCard
                        data={msg.resultCards.marketSnapshot}
                        onViewDetails={() =>
                          handleViewMarketDetails(msg.resultCards!.marketSnapshot!.symbol)
                        }
                        onAddToWatchlist={() =>
                          handleAddToWatchlist(msg.resultCards!.marketSnapshot!.symbol)
                        }
                      />
                    )}
                    {msg.resultCards.riskCheck && (
                      <RiskCheckCard
                        data={msg.resultCards.riskCheck}
                        onViewReport={handleViewRiskReport}
                        onAdjustStrategy={handleAdjustStrategy}
                      />
                    )}
                    {msg.resultCards.allocationDiagnostics && (
                      <AllocationDiagnosticsCard
                        data={msg.resultCards.allocationDiagnostics}
                        onRebalance={() =>
                          handleRebalance(msg.resultCards!.allocationDiagnostics!)
                        }
                        onViewAllocation={handleViewAllocation}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 bg-card border-t relative">
          <div className="relative max-w-3xl mx-auto flex items-center gap-0 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI Advisor anything..."
              disabled={isSending}
              className="min-w-0 flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-md rounded-r-none h-9"
            />
            <Button
              type="button"
              size="icon"
              className="size-9 shrink-0 rounded-l-none"
              onClick={onSend}
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center mt-3 text-muted-foreground">
            Powered by Quantum Labs AI · Experimental model v2.4
          </p>
        </div>
      </Card>
    );
  },
);

ChatPanel.displayName = "ChatPanel";