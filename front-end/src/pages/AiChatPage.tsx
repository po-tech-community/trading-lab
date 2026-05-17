import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Sparkles, ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { AiChatSidebar } from "./ai-chat/Sidebar"
import { ChatPanel } from "./ai-chat/ChatPanel"
import { useMcpChat } from "@/hooks/use-mcp-chat"
import {
  analyzeBacktestStream,
  buildBacktestContext,
  mcpInspect,
  mcpExecute,
  evidenceToCards,
  type McpPlannedTool,
} from "@/lib/ai-api";
import { useChatContext } from "@/providers/ChatProvider";
import { listBacktestHistory, deleteBacktestHistory, type BacktestHistoryEntry } from "@/lib/backtest-history-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const [selectedBacktestId, setSelectedBacktestId] = useState("none")
  const { latestBacktest } = useChatContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: historyEntries = [] } = useQuery({
    queryKey: ["backtest-history"],
    queryFn: listBacktestHistory,
    staleTime: 30_000,
  })

  const handleDeleteHistory = useCallback(async (id: string) => {
    await deleteBacktestHistory(id)
    void queryClient.invalidateQueries({ queryKey: ["backtest-history"] })
    if (selectedBacktestId === id) setSelectedBacktestId("none")
  }, [queryClient, selectedBacktestId])

  const backtestSessions = useMemo(() => {
    const sessions: Array<{ id: string; label: string; createdAt?: string }> = [
      { id: "none", label: "No backtest" },
    ]
    for (const entry of historyEntries) {
      sessions.push({ id: entry._id, label: entry.label, createdAt: entry.createdAt })
    }
    return sessions
  }, [historyEntries])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pendingRef = useRef<PendingSession | null>(null)
  // Holds abort function for the active SSE stream, if any
  const abortStreamRef = useRef<(() => void) | null>(null)

  const {
    messages,
    addTextMessage,
    startStreamingMessage,
    appendToMessage,
    addMcpExecution,
    approveMcpExecution,
    denyMcpExecution,
    addResultCards,
    clearMessages,
  } = useMcpChat([{
    id: "welcome",
    text: "Welcome to the AI Advisor Studio. Ask me anything about your DCA backtest strategy.",
    sender: "ai",
    timestamp: new Date(),
  }])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Abort any in-flight stream when the component unmounts
  useEffect(() => {
    return () => { abortStreamRef.current?.() }
  }, [])

  const selectedBacktestContext = useMemo(() => {
    if (selectedBacktestId === "none") return undefined
    const historyEntry: BacktestHistoryEntry | undefined = historyEntries.find(
      (e) => e._id === selectedBacktestId,
    )
    if (historyEntry) {
      return buildBacktestContext(historyEntry.summary, historyEntry.trades, {
        mode: historyEntry.mode,
        symbol: historyEntry.config?.symbol,
        assets: historyEntry.config?.assets,
      })
    }
    if (selectedBacktestId === "latest" && latestBacktest) {
      return buildBacktestContext(latestBacktest.summary, latestBacktest.trades, {
        mode: latestBacktest.mode,
        symbol: latestBacktest.symbol,
        assets: latestBacktest.assets,
      })
    }
    return undefined
  }, [selectedBacktestId, historyEntries, latestBacktest])

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
      const result =
        approvedTools.length > 0
          ? await mcpExecute({
              userQuery: session.queryWithHistory,
              backtestContext: selectedBacktestContext,
              approvedTools,
            })
          : null

      if (result) {
        const cards = result.evidence ? evidenceToCards(result.evidence) : undefined
        if (cards) addResultCards(cards)
        // For the MCP-execute path we still get a full response — stream it char by char
        // to keep the UX consistent (typewriter feel without an extra round-trip).
        const msgId = startStreamingMessage()
        for (const char of result.advice) {
          appendToMessage(msgId, char)
          await new Promise<void>((r) => setTimeout(r, 4))
        }
      } else {
        // No approved tools — fall back to streaming analyze
        const msgId = startStreamingMessage()
        setIsSending(true)
        const abort = analyzeBacktestStream(
          { userQuery: session.queryWithHistory, backtestContext: selectedBacktestContext },
          {
            onMeta: (meta) => {
              if (meta.evidence) {
                const cards = evidenceToCards(meta.evidence as Parameters<typeof evidenceToCards>[0])
                if (cards) addResultCards(cards)
              }
            },
            onToken: (token) => appendToMessage(msgId, token),
            onDone: () => setIsSending(false),
            onError: (msg) => {
              appendToMessage(msgId, `\n\n_Error: ${msg}_`)
              setIsSending(false)
            },
          },
        )
        abortStreamRef.current = abort
      }
    } catch {
      addTextMessage("Analysis failed. Please try again.", "ai")
    }
  }

  // ── Step 1: inspect tools, show approval panels / start stream ────────────────

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    // Abort any previous stream
    abortStreamRef.current?.()
    abortStreamRef.current = null

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
        const msgId = startStreamingMessage()
        const abort = analyzeBacktestStream(
          { userQuery: queryWithHistory, backtestContext: selectedBacktestContext },
          {
            onMeta: (meta) => {
              if (meta.evidence) {
                const cards = evidenceToCards(meta.evidence as Parameters<typeof evidenceToCards>[0])
                if (cards) addResultCards(cards)
              }
            },
            onToken: (token) => {
              appendToMessage(msgId, token)
            },
            onDone: () => {
              setIsSending(false)
            },
            onError: (msg) => {
              appendToMessage(msgId, `\n\n_Error: ${msg}_`)
              setIsSending(false)
            },
          },
        )
        abortStreamRef.current = abort
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
      // Only clear isSending if we're NOT in a streaming path (streaming clears it in onDone/onError)
      if (!abortStreamRef.current) {
        setIsSending(false)
      }
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
          onDeleteSession={handleDeleteHistory}
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