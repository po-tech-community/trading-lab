/**
 * ChatProvider  —  ENH-2 + ENH-3
 *
 * ENH-2  Stores the most-recently-completed backtest result (summary + trades)
 *        so FloatingAiChat (and AiAdvisorPanel) can send it as context to the
 *        AI even when the user hasn't opened the panel from a backtest page.
 *
 * ENH-3  Lifts the floating-chat message history out of FloatingAiChat's local
 *        state into this context so the conversation survives:
 *          • collapsing / expanding AiAdvisorPanel
 *          • navigating between DCA Backtest and Portfolio pages
 *          • any other route change inside the MainLayout shell
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { BacktestSummary, BacktestTrade } from "@/lib/backtest-api";

// ── Message type ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

// ── AiAdvisorPanel message type (matches AiAdvisorPanel's internal Message) ──

export interface PanelMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedActions?: string[];
  isLoading?: boolean;
}

// ── Backtest snapshot stored in context ───────────────────────────────────────

export interface BacktestSnapshot {
  summary: BacktestSummary;
  trades: BacktestTrade[];
  /** "single" | "portfolio" — used to build the AI context string */
  mode: "single" | "portfolio";
  /** Human-readable label, e.g. "BTC DCA" or "BTC / ETH portfolio" */
  label: string;
  /** Single-asset mode: the traded symbol (e.g. "BTC") */
  symbol?: string;
  /** Portfolio mode: asset weights passed to the backtest */
  assets?: Array<{ symbol: string; weight: number }>;
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface ChatContextValue {
  /** Floating chat message history (ENH-3) */
  floatingMessages: ChatMessage[];
  setFloatingMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addFloatingMessage: (text: string, sender: "user" | "ai") => void;

  /** AiAdvisorPanel message history (ENH-3) */
  panelMessages: PanelMessage[];
  setPanelMessages: React.Dispatch<React.SetStateAction<PanelMessage[]>>;

  /** Most-recently completed backtest result (ENH-2) */
  latestBacktest: BacktestSnapshot | null;
  setLatestBacktest: (snapshot: BacktestSnapshot | null) => void;
}

// ── Context + hook ────────────────────────────────────────────────────────────

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used inside <ChatProvider>");
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

const INITIAL_FLOATING_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    text: "Hello! I'm your AI Advisor. How can I help you with your trading strategy today?",
    sender: "ai",
    timestamp: new Date(),
  },
];

export function ChatProvider({ children }: { children: ReactNode }) {
  const [floatingMessages, setFloatingMessages] = useState<ChatMessage[]>(
    INITIAL_FLOATING_MESSAGES,
  );
  const [panelMessages, setPanelMessages] = useState<PanelMessage[]>([]);
  const [latestBacktest, setLatestBacktest] =
    useState<BacktestSnapshot | null>(null);

  const addFloatingMessage = useCallback(
    (text: string, sender: "user" | "ai") => {
      setFloatingMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text, sender, timestamp: new Date() },
      ]);
    },
    [],
  );

  return (
    <ChatContext.Provider
      value={{
        floatingMessages,
        setFloatingMessages,
        addFloatingMessage,
        panelMessages,
        setPanelMessages,
        latestBacktest,
        setLatestBacktest,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}