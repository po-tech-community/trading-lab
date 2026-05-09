/**
 * AiAdvisorPanel  —  L4-FE-1 + L4-FE-2 + L4-FE-3
 *
 * L4-FE-1  Slide-over sheet opened by "Consult AI Advisor" button.
 *          Backtest summary is shown in the panel header / first assistant message.
 *
 * L4-FE-2  Chat UI: user input, assistant replies with markdown rendering,
 *          loading spinner while the request is in flight.
 *
 * L4-FE-3  If the API returns `suggestedActions` (string[]), render them as
 *          clickable chips that call `onSuggestedAction` so the parent can
 *          prefill the form or scroll to config.
 */
 
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  BrainCircuit,
  Send,
  Sparkles,
  User,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BacktestSummary, BacktestTrade } from "@/lib/backtest-api";
import {
  analyzeBacktest,
  buildBacktestContext,
  parseActionLabel,
  type AiAnalyzeResponse,
  type SuggestedAction,
} from "@/lib/ai-api";
 
// ── Markdown renderer (lightweight, no external dep) ─────────────────────────
 
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
 
function renderMarkdown(text: string): string {
  return (
    text
      .replace(
        /```[\s\S]*?```/g,
        (m) =>
          `<pre class="bg-muted rounded p-2 text-xs overflow-x-auto my-2 border"><code>${escapeHtml(m.slice(3, -3).replace(/^\w+\n/, ""))}</code></pre>`,
      )
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>',
      )
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-base mt-3 mb-1">$1</h2>')
      .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, "<br/>")
  );
}
 
function MarkdownContent({ text }: { text: string }) {
  return (
    <div
      className="prose-sm text-sm leading-relaxed [&_p]:mb-2 [&_li]:my-0.5"
      dangerouslySetInnerHTML={{
        __html: `<p class="mb-2">${renderMarkdown(text)}</p>`,
      }}
    />
  );
}
 
// ── Formatters ────────────────────────────────────────────────────────────────
 
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
 
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
 
function buildSummaryText(summary: BacktestSummary): string {
  return `Invested ${currency.format(summary.totalInvested)} → ${currency.format(summary.currentValue)} (${pct(summary.totalReturnPercentage)} ROI) over ${summary.numberOfPurchases} purchases.`;
}
 
// ── Types ─────────────────────────────────────────────────────────────────────
 
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Raw string labels from backend — parsed to SuggestedAction for chip rendering */
  suggestedActions?: string[];
  isLoading?: boolean;
}
 
export interface ChatProps {
  summary: BacktestSummary | null;
  trades?: BacktestTrade[];
  mode?: "single" | "portfolio";
  assets?: Array<{ symbol: string; weight: number }>;
  config?: {
    symbol?: string;
    amount?: number;
    frequency?: string;
    startDate?: number;
    endDate?: number;
  };
  /** Called when user clicks a suggested-action chip */
  onSuggestedAction?: (action: SuggestedAction) => void;
}
 
export interface AiAdvisorPanelProps extends ChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
 
// ── Main component ────────────────────────────────────────────────────────────
 
export function AiAdvisorPanel({
  open,
  onOpenChange,
  summary,
  trades,
  mode,
  assets,
  config,
  onSuggestedAction,
}: AiAdvisorPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
 
  // Reset chat when a new backtest result arrives
  useEffect(() => {
    if (!summary) return;
 
    const welcomeContent =
      `Hello! I've reviewed your backtest results.\n\n` +
      `**${buildSummaryText(summary)}**\n\n` +
      `Ask me anything — why the strategy performed this way, how to adjust it, or what to test next.`;
 
    setMessages([{ id: "welcome", role: "assistant", content: welcomeContent }]);
  }, [summary]);
 
  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);
 
  // Focus textarea when panel opens
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 300);
  }, [open]);
 
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text.trim() };
    const loadingMsg: Message = { id: `loading-${Date.now()}`, role: "assistant", content: "", isLoading: true };

    // Build conversation history before updating state (Fix #1)
    const history = messages
      .filter((m) => !m.isLoading && m.id !== "welcome")
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");
    const queryWithHistory = history
      ? `Previous conversation:\n${history}\n\nUser: ${text.trim()}`
      : text.trim();

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const result: AiAnalyzeResponse = await analyzeBacktest({
        userQuery: queryWithHistory,
        backtestContext: summary
          ? buildBacktestContext(summary, trades, { ...config, mode, assets })
          : undefined,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? {
                ...m,
                id: `a-${Date.now()}`,
                content: result.advice,
                isLoading: false,
                suggestedActions: result.suggestedActions,
              }
            : m,
        ),
      );
    } catch (err) {
      // Fix #3: distinguish common HTTP error codes
      const status = (err as { status?: number }).status;
      const errorContent =
        status === 401 ? "Please log in to use the AI advisor." :
        status === 429 ? "Too many requests. Please wait a moment before trying again." :
        status === 503 ? "AI service is not configured. Please contact the administrator." :
        "Sorry, I couldn't reach the AI advisor right now. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? {
                ...m,
                id: `err-${Date.now()}`,
                content: errorContent,
                isLoading: false,
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleSend = () => { if (input.trim()) sendMessage(input); };
 
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };
 
  // L4-FE-3: parse the plain string label → typed SuggestedAction for the parent
  const handleChipClick = (label: string) => {
    const action = parseActionLabel(label);
    onSuggestedAction?.(action);
    sendMessage(`Apply suggestion: ${label}`);
  };
 
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[480px] p-0 flex flex-col gap-0"
      >
        {/* ── Header (L4-FE-1) ─────────────────────────────────────────── */}
        <SheetHeader className="px-5 py-4 border-b bg-muted/40 flex-shrink-0 gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BrainCircuit className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-base flex items-center gap-1.5">
                  AI Advisor
                  <Sparkles className="size-3 text-primary" />
                </SheetTitle>
                <SheetDescription className="text-xs">
                  DCA strategy analysis
                </SheetDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
 
          {/* Backtest summary snapshot */}
          {summary ? (
            <div className="mt-1 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{buildSummaryText(summary)}</span>
            </div>
          ) : (
            <div className="mt-1 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
              Run a backtest first to get context-aware advice.
            </div>
          )}
        </SheetHeader>
 
        {/* ── Messages (L4-FE-2) ───────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground text-sm">
              <Bot className="size-10 opacity-30" />
              <p>Run a backtest then ask me anything.</p>
            </div>
          )}
 
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1">
              <div className={cn("flex items-start gap-2", msg.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "size-7 rounded-md flex items-center justify-center shrink-0 border mt-0.5",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border",
                )}>
                  {msg.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>
 
                <div className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-sm border max-w-[85%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none border-primary/20"
                    : "bg-muted text-foreground rounded-tl-none border-border",
                )}>
                  {msg.isLoading ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Thinking…</span>
                    </div>
                  ) : msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownContent text={msg.content} />
                  )}
                </div>
              </div>
 
              {/* L4-FE-3: Suggested action chips — actions are plain strings from backend */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="ml-9 flex flex-wrap gap-2 mt-1">
                  {msg.suggestedActions.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => handleChipClick(label)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1",
                        "text-xs font-medium text-primary border-primary/30 bg-primary/5",
                        "hover:bg-primary/10 hover:border-primary/50 transition-colors cursor-pointer",
                      )}
                    >
                      <ChevronRight className="size-3" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
 
        {/* ── Input (L4-FE-2) ──────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t bg-muted/30 p-4">
          {messages.length <= 1 && summary && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                "Why did this strategy perform this way?",
                "Is my stop-loss too aggressive?",
                "What frequency should I test next?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs rounded-full border px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-border transition-colors bg-background"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
 
          <div className="flex items-end gap-2 rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 px-3 py-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your strategy… (Enter to send, Shift+Enter for newline)"
              className="min-h-0 flex-1 resize-none border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm max-h-32"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              className="size-8 shrink-0 rounded-lg"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 text-center">
            AI advice is for informational purposes only.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
 
// ── Trigger button ────────────────────────────────────────────────────────────
 
export function AiAdvisorTrigger({ onClick, hasResult }: { onClick: () => void; hasResult: boolean }) {
  return (
    <Button variant={hasResult ? "default" : "outline"} size="sm" onClick={onClick} className="gap-2">
      <BrainCircuit className="size-4" />
      Consult AI Advisor
      {hasResult && (
        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">Ready</Badge>
      )}
    </Button>
  );
}