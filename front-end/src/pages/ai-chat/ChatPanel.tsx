import { forwardRef } from "react";
import type { ForwardedRef, KeyboardEvent } from "react";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { McpExecutionPanel } from "@/components/mcp/McpExecutionPanel";
import { MarketSnapshotCard, RiskCheckCard, AllocationDiagnosticsCard } from "@/components/mcp/ResultCards";
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
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSend();
      }
    };

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
                        onViewDetails={() => console.log('View market details')}
                        onAddToWatchlist={() => console.log('Add to watchlist')}
                      />
                    )}
                    {msg.resultCards.riskCheck && (
                      <RiskCheckCard
                        data={msg.resultCards.riskCheck}
                        onViewReport={() => console.log('View risk report')}
                        onAdjustStrategy={() => console.log('Adjust strategy')}
                      />
                    )}
                    {msg.resultCards.allocationDiagnostics && (
                      <AllocationDiagnosticsCard
                        data={msg.resultCards.allocationDiagnostics}
                        onRebalance={() => console.log('Rebalance portfolio')}
                        onViewAllocation={() => console.log('View allocation')}
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
    );
  },
);

ChatPanel.displayName = "ChatPanel";
