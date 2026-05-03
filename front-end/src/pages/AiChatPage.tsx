import { useState, useRef, useEffect } from "react"
import { Sparkles, ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { AiChatSidebar } from "./ai-chat/Sidebar"
import { ChatPanel } from "./ai-chat/ChatPanel"
import { useMcpChat } from "@/hooks/use-mcp-chat"
import { analyzeBacktest } from "@/lib/ai-api";

export default function AiChatPage() {
  const [input, setInput] = useState("")
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    addTextMessage,
    addMcpExecution,
    approveMcpExecution,
    denyMcpExecution,
    addResultCards,
  } = useMcpChat()

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addTextMessage("Welcome to the Fullscreen AI Advisor! How can I help you analyze the markets today?", "ai")
    }
  }, [messages.length, addTextMessage])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return;

    addTextMessage(input, "user");
    setInput("");

    // MCP Demo Workflow
    if (input.toLowerCase().includes("analyze market")) {
      // Add AI response
      addTextMessage("I'll analyze the current market conditions for you. This requires accessing real-time market data.", "ai");

      // Add MCP execution request
      const executionId = addMcpExecution({
        toolName: "Market Data Fetcher",
        purpose: "Retrieve real-time market data for AAPL, MSFT, and GOOGL",
        inputPreview: {
          symbols: ["AAPL", "MSFT", "GOOGL"],
          timeframe: "1D",
          includeFundamentals: true
        },
        status: "pending"
      });

      // Simulate approval timeout for demo
      setTimeout(() => {
        if (executionId) {
          handleMcpApprove(executionId);
        }
      }, 2000);

    } else if (input.toLowerCase().includes("risk assessment")) {
      addTextMessage("Let me perform a comprehensive risk assessment of your portfolio.", "ai");

      const executionId = addMcpExecution({
        toolName: "Risk Analyzer",
        purpose: "Calculate portfolio risk metrics including volatility, Sharpe ratio, and VaR",
        inputPreview: {
          portfolio: ["AAPL", "MSFT", "GOOGL"],
          weights: [0.4, 0.3, 0.3],
          benchmark: "SPY"
        },
        status: "pending"
      });

      setTimeout(() => {
        if (executionId) {
          handleMcpApprove(executionId);
        }
      }, 2000);

    } else if (input.toLowerCase().includes("rebalance")) {
      addTextMessage("I'll check your portfolio allocation and suggest rebalancing actions.", "ai");

      const executionId = addMcpExecution({
        toolName: "Portfolio Optimizer",
        purpose: "Analyze current allocation vs target and generate rebalancing trades",
        inputPreview: {
          currentHoldings: { AAPL: 100, MSFT: 50, GOOGL: 75 },
          targetAllocation: { AAPL: 0.35, MSFT: 0.35, GOOGL: 0.30 },
          totalValue: 50000
        },
        status: "pending"
      });

      setTimeout(() => {
        if (executionId) {
          handleMcpApprove(executionId);
        }
      }, 2000);

    } else {
      try {
        const result = await analyzeBacktest({ userQuery: input.trim() });
        addTextMessage(result.advice, "ai");
      } catch {
        addTextMessage("Sorry, I couldn't reach the AI advisor right now. Please try again.", "ai");
      }
    }
  };

  const handleMcpApprove = (id: string) => {
    approveMcpExecution(id);

    // Simulate results after execution completes
    setTimeout(() => {
      // Mock market data results
      addResultCards({
        marketSnapshot: {
          symbol: "AAPL",
          price: 175.43,
          change: 2.15,
          changePercent: 1.24,
          volume: 52847392,
          marketCap: 2750000000000,
          peRatio: 28.5,
          dividendYield: 0.82
        }
      });

      addTextMessage("Market analysis complete! I've also prepared a risk assessment and portfolio rebalancing recommendation.", "ai");

      // Add risk check results
      addResultCards({
        riskCheck: {
          overallRisk: "medium",
          volatility: 18.5,
          sharpeRatio: 1.85,
          maxDrawdown: -12.3,
          beta: 1.15,
          var95: -8.7,
          stressTestResult: "Portfolio passed stress test with acceptable losses"
        }
      });

      // Add allocation diagnostics
      addResultCards({
        allocationDiagnostics: {
          currentAllocation: { AAPL: 0.45, MSFT: 0.35, GOOGL: 0.20 },
          targetAllocation: { AAPL: 0.35, MSFT: 0.35, GOOGL: 0.30 },
          rebalanceNeeded: true,
          driftAmount: 15.2,
          suggestedTrades: [
            { symbol: "AAPL", action: "sell", shares: 25, estimatedValue: 4375 },
            { symbol: "GOOGL", action: "buy", shares: 15, estimatedValue: 2250 }
          ]
        }
      });
    }, 3000);
  };

  const handleMcpDeny = (id: string) => {
    denyMcpExecution(id);
    addTextMessage("Tool execution denied. Let me know if you'd like to try a different analysis.", "ai");
  };

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
        {/* Sidebar / history (mock) */}
        <AiChatSidebar />

        {/* Main chat interface */}
        <ChatPanel
          ref={scrollRef}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onMcpApprove={handleMcpApprove}
          onMcpDeny={handleMcpDeny}
        />
      </div>
    </div>
  )
}
