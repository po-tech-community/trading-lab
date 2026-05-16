import { forwardRef, useState } from "react";
import type { ForwardedRef, KeyboardEvent } from "react";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { McpExecutionPanel } from "@/components/mcp/McpExecutionPanel";
import { MarketSnapshotCard, RiskCheckCard, AllocationDiagnosticsCard } from "@/components/mcp/ResultCards";
import type { MarketSnapshotData, RiskCheckData, AllocationDiagnosticsData } from "@/components/mcp/ResultCards";
import { MarkdownContent } from "@/components/ai/MarkdownContent";
import type { ChatMessage } from "@/hooks/use-mcp-chat";

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  inputRef?: ForwardedRef<HTMLInputElement>;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onMcpApprove?: (id: string) => void;
  onMcpDeny?: (id: string) => void;
  isSending?: boolean;
}

type ResultDialogState =
  | { type: "market"; data: MarketSnapshotData }
  | { type: "risk"; data: RiskCheckData }
  | { type: "allocation"; data: AllocationDiagnosticsData }
  | null;

const WATCHLIST_STORAGE_KEY = "trading-lab-watchlist";

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function readWatchlist() {
  try {
    const value = JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Right-hand chat panel for the AI Advisor:
 * - Small header with avatar and status.
 * - Scrollable message list.
 * - Single-line text input with send button.
 *
 * Per AI-FE-5 the AI message body uses the shared `MarkdownContent` renderer
 * (bold, italic, headings, lists, inline code) instead of plain text.
 */
export const ChatPanel = forwardRef<HTMLDivElement, ChatPanelProps>(
  (
    { messages, input, inputRef, onInputChange, onSend, onMcpApprove, onMcpDeny, isSending = false },
    scrollRef: ForwardedRef<HTMLDivElement>,
  ) => {
    const navigate = useNavigate();
    const [resultDialog, setResultDialog] = useState<ResultDialogState>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSend();
      }
    };

    const handleViewMarketDetails = (data: MarketSnapshotData) => {
      setResultDialog({ type: "market", data });
    };

    const handleAddToWatchlist = (data: MarketSnapshotData) => {
      const saved = readWatchlist();
      const symbol = data.symbol.trim().toUpperCase();
      if (saved.includes(symbol)) {
        toast.info(`${symbol} is already on your watchlist`);
        return;
      }
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([...saved, symbol]));
      toast.success(`${symbol} added to watchlist`);
    };

    const handleAdjustStrategy = () => {
      navigate("/home/backtest#strategy-config");
      toast.info("Opening strategy configuration");
    };

    const handleRebalance = () => {
      navigate("/home/portfolio#portfolio-config");
      toast.info("Opening portfolio configuration for rebalancing");
    };

    const handleViewAllocation = (data: AllocationDiagnosticsData) => {
      if (Object.keys(data.currentAllocation).length > 0) {
        setResultDialog({ type: "allocation", data });
        return;
      }
      navigate("/home/portfolio#allocation-overview");
      toast.info("Opening portfolio allocation");
    };

    return (
      <>
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
                  {msg.sender === "ai" ? (
                    // AI-FE-5: render assistant replies as markdown.
                    <MarkdownContent text={msg.text} />
                  ) : (
                    // User messages stay as plain text (preserves whitespace).
                    <p className="whitespace-pre-wrap">{msg.text}</p>
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
                        onViewDetails={() => handleViewMarketDetails(msg.resultCards!.marketSnapshot!)}
                        onAddToWatchlist={() => handleAddToWatchlist(msg.resultCards!.marketSnapshot!)}
                      />
                    )}
                    {msg.resultCards.riskCheck && (
                      <RiskCheckCard
                        data={msg.resultCards.riskCheck}
                        onViewReport={() => setResultDialog({ type: "risk", data: msg.resultCards!.riskCheck! })}
                        onAdjustStrategy={handleAdjustStrategy}
                      />
                    )}
                    {msg.resultCards.allocationDiagnostics && (
                      <AllocationDiagnosticsCard
                        data={msg.resultCards.allocationDiagnostics}
                        onRebalance={handleRebalance}
                        onViewAllocation={() => handleViewAllocation(msg.resultCards!.allocationDiagnostics!)}
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
              ref={inputRef}
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
      <Dialog open={!!resultDialog} onOpenChange={(open) => !open && setResultDialog(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              {resultDialog?.type === "market" && `${resultDialog.data.symbol} Market Details`}
              {resultDialog?.type === "risk" && "Risk Report"}
              {resultDialog?.type === "allocation" && "Allocation Details"}
            </DialogTitle>
            <DialogDescription>
              {resultDialog?.type === "market" && "Snapshot metrics returned by the AI market tool."}
              {resultDialog?.type === "risk" && "Risk metrics returned by the AI risk tools."}
              {resultDialog?.type === "allocation" && "Current allocation and suggested trades returned by the AI diagnostics tools."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {resultDialog?.type === "market" && (
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Price</p>
                  <p className="text-lg font-semibold">${resultDialog.data.price.toFixed(2)}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">24h Change</p>
                  <p className="text-lg font-semibold">{formatPercent(resultDialog.data.changePercent)}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Volume</p>
                  <p className="font-medium">{resultDialog.data.volume.toLocaleString()}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Market Cap</p>
                  <p className="font-medium">{resultDialog.data.marketCap.toLocaleString()}</p>
                </div>
              </div>
            )}
            {resultDialog?.type === "risk" && (
              <div className="space-y-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Overall Risk</p>
                    <p className="text-lg font-semibold capitalize">{resultDialog.data.overallRisk}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Volatility</p>
                    <p className="text-lg font-semibold">{resultDialog.data.volatility.toFixed(2)}%</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Max Drawdown</p>
                    <p className="font-medium">{resultDialog.data.maxDrawdown.toFixed(2)}%</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">VaR (95%)</p>
                    <p className="font-medium">{resultDialog.data.var95.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Stress Test</p>
                  <p className="font-medium">{resultDialog.data.stressTestResult}</p>
                </div>
              </div>
            )}
            {resultDialog?.type === "allocation" && (
              <div className="space-y-4 text-sm">
                <div className="grid gap-2">
                  {Object.entries(resultDialog.data.currentAllocation).map(([symbol, weight]) => (
                    <div key={symbol} className="flex items-center justify-between rounded-md border p-3">
                      <span className="font-medium">{symbol}</span>
                      <span>{weight.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
                {resultDialog.data.suggestedTrades.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">Suggested trades</p>
                    {resultDialog.data.suggestedTrades.map((trade) => (
                      <div key={`${trade.symbol}-${trade.action}`} className="flex items-center justify-between rounded-md border p-3">
                        <span className="font-medium">{trade.action.toUpperCase()} {trade.symbol}</span>
                        <span>{trade.shares} shares · ${trade.estimatedValue.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
      </>
    );
  },
);

ChatPanel.displayName = "ChatPanel";
