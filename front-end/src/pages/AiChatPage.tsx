import { useState, useRef, useEffect } from "react"
import { Sparkles, ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { AiChatSidebar } from "./ai-chat/Sidebar"
import { ChatPanel } from "./ai-chat/ChatPanel"
import { useMcpChat } from "@/hooks/use-mcp-chat"
import {
  analyzeBacktest,
  buildBacktestContext,
  mcpInspect,
  mcpExecute,
  evidenceToCards,
  type McpPlannedTool,
} from "@/lib/ai-api";
import type { BacktestSummary, BacktestTrade } from "@/lib/backtest-api";

// Tracks the in-flight approval session across approve/deny callbacks.
interface PendingSession {
  userQuery: string;
  queryWithHistory: string;
  // decisions keyed by executionId from useMcpChat
  decisions: Map<string, {
    providerId: string;
    toolName: string;
    approved: boolean | null;
  }>;
}

const backtestSessions: Array<{
  id: string;
  label: string;
  summary: BacktestSummary;
  trades: BacktestTrade[];
  config: {
    mode: "single" | "portfolio";
    symbol?: string;
    assets?: Array<{ symbol: string; weight: number }>;
    amount?: number;
    frequency?: string;
    startDate?: number;
    endDate?: number;
  };
}> = [
  {
    id: "none",
    label: "No backtest",
    summary: {
      totalInvested: 0,
      currentValue: 0,
      totalReturnPercentage: 0,
      totalHoldings: 0,
      numberOfPurchases: 0,
      realizedProfit: 0,
      unrealizedValue: 0,
    },
    trades: [],
    config: { mode: "single" },
  },
  {
    id: "latest-dca",
    label: "Latest DCA result",
    summary: {
      totalInvested: 5400,
      currentValue: 6150,
      totalReturnPercentage: 13.9,
      totalHoldings: 0,
      numberOfPurchases: 24,
      realizedProfit: 450,
      unrealizedValue: 750,
    },
    trades: [
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 45,
        type: "takeProfit",
        price: 42000,
        units: 0.05,
        profit: 150,
        sellAction: 100,
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 12,
        type: "stopLoss",
        price: 38000,
        units: 0.02,
        profit: -60,
        sellAction: 100,
      },
    ],
    config: {
      mode: "single",
      symbol: "BTC",
      amount: 225,
      frequency: "weekly",
      startDate: Date.now() - 1000 * 60 * 60 * 24 * 365,
      endDate: Date.now(),
    },
  },
  {
    id: "latest-portfolio",
    label: "Latest portfolio result",
    summary: {
      totalInvested: 12000,
      currentValue: 13800,
      totalReturnPercentage: 15,
      totalHoldings: 0,
      numberOfPurchases: 24,
      realizedProfit: 600,
      unrealizedValue: 1800,
    },
    trades: [
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 40,
        type: "takeProfit",
        price: 3200,
        units: 0.3,
        profit: 120,
        sellAction: 100,
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 20,
        type: "stopLoss",
        price: 2150,
        units: 0.2,
        profit: -80,
        sellAction: 100,
      },
    ],
    config: {
      mode: "portfolio",
      assets: [
        { symbol: "BTC", weight: 60 },
        { symbol: "ETH", weight: 40 },
      ],
      amount: 500,
      frequency: "weekly",
      startDate: Date.now() - 1000 * 60 * 60 * 24 * 365,
      endDate: Date.now(),
    },
  },
];

/**
 * Build a compact inputPreview for McpExecutionPanel.
 * Strips the full backtestContext blob (too large for UI) and shows just the mode/title.
 */
function buildInputPreview(tool: McpPlannedTool): Record<string, unknown> {
  const preview: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tool.input)) {
    if (k === "backtestContext" && v && typeof v === "object") {
      const ctx = v as Record<string, unknown>;
      preview.backtestContext = { mode: ctx.mode, title: ctx.title };
    } else {
      preview[k] = v;
    }
  }
  return preview;
}

export default function AiChatPage() {
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedBacktestId, setSelectedBacktestId] = useState("latest-dca")
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pendingRef = useRef<PendingSession | null>(null)

  const {
    messages,
    addTextMessage,
    addMcpExecution,
    approveMcpExecution,
    denyMcpExecution,
    addResultCards,
    clearMessages,
  } = useMcpChat()

  useEffect(() => {
    if (messages.length === 0) {
      addTextMessage(
        "Welcome to the AI Advisor Studio. Ask me anything about your DCA backtest strategy.",
        "ai",
      )
    }
  }, [messages.length, addTextMessage])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const selectedBacktest = backtestSessions.find((item) => item.id === selectedBacktestId)
  const selectedBacktestContext =
    selectedBacktest && selectedBacktest.id !== "none"
      ? buildBacktestContext(selectedBacktest.summary, selectedBacktest.trades, selectedBacktest.config)
      : undefined

  const buildQueryWithHistory = (query: string) => {
    const history = messages
      .filter((msg) => !msg.mcpExecution && !msg.resultCards)
      .slice(-6)
      .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n")

    return history ? `Previous conversation:\n${history}\n\nUser: ${query}` : query
  }

  const getAiErrorMessage = (error: unknown) => {
    const status = (error as { status?: number })?.status
    return status === 401
      ? "Please log in to use the AI advisor."
      : status === 429
      ? "Too many requests. Please wait a moment before trying again."
      : status === 503
      ? "AI service is not configured. Please contact the administrator."
      : "Sorry, I couldn't reach the AI advisor right now. Please try again."
  }

  // ── Step 2: execute approved tools once all decisions are in ─────────────────

  const runAfterDecisions = async () => {
    const session = pendingRef.current
    if (!session) return

    const allDecided = [...session.decisions.values()].every(
      (d) => d.approved !== null,
    )
    if (!allDecided) return

    const approvedTools = [...session.decisions.values()]
      .filter((d) => d.approved)
      .map(({ providerId, toolName }) => ({ providerId, toolName }))

    pendingRef.current = null

    try {
      if (approvedTools.length > 0) {
        const result = await mcpExecute({
          userQuery: session.queryWithHistory,
          backtestContext: selectedBacktestContext,
          approvedTools,
        })

        const cards = result.evidence ? evidenceToCards(result.evidence) : undefined
        if (cards) addResultCards(cards)

        addTextMessage(result.advice, "ai")
      } else {
        const result = await analyzeBacktest({
          userQuery: session.queryWithHistory,
          backtestContext: selectedBacktestContext,
        })

        addTextMessage(result.advice, "ai")
      }
    } catch (error) {
      addTextMessage(getAiErrorMessage(error), "ai")
    }
  }

  // ── Step 1: inspect tools, show approval panels ───────────────────────────────

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const query = input.trim()
    setInput("")
    setIsSending(true)
    addTextMessage(query, "user")

    try {
      const queryWithHistory = buildQueryWithHistory(query)
      const inspection = await mcpInspect({
        userQuery: queryWithHistory,
        backtestContext: selectedBacktestContext,
      })

      if (inspection.plannedTools.length === 0) {
        // MCP not configured → plain LLM analyze
        const result = await analyzeBacktest({
          userQuery: queryWithHistory,
          backtestContext: selectedBacktestContext,
        })
        addTextMessage(result.advice, "ai")
        return
      }

      const toolCount = inspection.plannedTools.length
      addTextMessage(
        `To answer your question I need to run ${toolCount} analysis tool${toolCount > 1 ? "s" : ""}. Please review and approve below:`,
        "ai",
      )

      pendingRef.current = {
        userQuery: query,
        queryWithHistory,
        decisions: new Map(),
      }

      for (const tool of inspection.plannedTools) {
        const executionId = addMcpExecution({
          toolName: tool.title ?? tool.toolName,
          purpose: tool.description ?? `Run ${tool.toolName} from ${tool.providerName}`,
          inputPreview: buildInputPreview(tool),
          status: "pending",
        })
        pendingRef.current?.decisions.set(executionId, {
          providerId: tool.providerId,
          toolName: tool.toolName,
          approved: null,
        })
      }
    } catch (error) {
      addTextMessage(getAiErrorMessage(error), "ai")
    } finally {
      setIsSending(false)
    }
  }

  const handleMcpApprove = (id: string) => {
    approveMcpExecution(id)
    const decision = pendingRef.current?.decisions.get(id)
    if (decision) {
      decision.approved = true
      void runAfterDecisions()
    }
  }

  const handleMcpDeny = (id: string) => {
    denyMcpExecution(id)
    const decision = pendingRef.current?.decisions.get(id)
    if (decision) {
      decision.approved = false
      void runAfterDecisions()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        label="Advanced Intelligence"
        icon={Sparkles}
        iconClassName="fill-primary"
        title="AI Advisor Studio"
        description="Experience the full power of our analytical engine in this dedicated workspace."
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-4 mr-2" />
            Back
          </Button>
        }
        className="mb-8"
      />

      <div className="flex-1 flex gap-8 min-h-0">
        <AiChatSidebar
          sessions={backtestSessions}
          selectedSessionId={selectedBacktestId}
          onSessionChange={setSelectedBacktestId}
          onNewInvestigation={() => {
            clearMessages()
            inputRef.current?.focus()
          }}
        />

        <ChatPanel
          ref={scrollRef}
          inputRef={inputRef}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onMcpApprove={handleMcpApprove}
          onMcpDeny={handleMcpDeny}
          isSending={isSending}
        />
      </div>
    </div>
  )
}
