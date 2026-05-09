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
  mcpInspect,
  mcpExecute,
  evidenceToCards,
  type McpPlannedTool,
} from "@/lib/ai-api";

// Tracks the in-flight approval session across approve/deny callbacks.
interface PendingSession {
  userQuery: string;
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
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<PendingSession | null>(null)

  const {
    messages,
    addTextMessage,
    addMcpExecution,
    approveMcpExecution,
    denyMcpExecution,
    addResultCards,
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
          ? await mcpExecute({ userQuery: session.userQuery, approvedTools })
          : await analyzeBacktest({ userQuery: session.userQuery })

      const cards = result.evidence ? evidenceToCards(result.evidence) : undefined
      if (cards) addResultCards(cards)

      addTextMessage(result.advice, "ai")
    } catch {
      addTextMessage("Analysis failed. Please try again.", "ai")
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
      const inspection = await mcpInspect({ userQuery: query })

      if (inspection.plannedTools.length === 0) {
        // MCP not configured → plain LLM analyze
        const result = await analyzeBacktest({ userQuery: query })
        addTextMessage(result.advice, "ai")
        return
      }

      const toolCount = inspection.plannedTools.length
      addTextMessage(
        `To answer your question I need to run ${toolCount} analysis tool${toolCount > 1 ? "s" : ""}. Please review and approve below:`,
        "ai",
      )

      pendingRef.current = { userQuery: query, decisions: new Map() }

      for (const tool of inspection.plannedTools) {
        const executionId = addMcpExecution({
          toolName: tool.title ?? tool.toolName,
          purpose: tool.description ?? `Run ${tool.toolName} from ${tool.providerName}`,
          inputPreview: buildInputPreview(tool),
          status: "pending",
        })
        pendingRef.current.decisions.set(executionId, {
          providerId: tool.providerId,
          toolName: tool.toolName,
          approved: null,
        })
      }
    } catch {
      addTextMessage(
        "Sorry, I couldn't reach the AI advisor right now. Please try again.",
        "ai",
      )
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
        <AiChatSidebar />

        <ChatPanel
          ref={scrollRef}
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
