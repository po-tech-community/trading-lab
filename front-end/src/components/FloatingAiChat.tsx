import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Maximize2, Send, Bot, Sparkles, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

/** Mock quick questions and canned responses for demo/testing */
const QUICK_QUESTIONS: { question: string; response: string }[] = [
  {
    question: "What is DCA?",
    response:
      "DCA (Dollar Cost Averaging) means investing a fixed amount at regular intervals (e.g. $100 every week). It reduces the impact of volatility and avoids trying to time the market. Use the DCA Backtest page to see how it would have performed historically.",
  },
  {
    question: "Best time to invest?",
    response:
      "With DCA, you don't need to pick the 'best' time—you spread purchases over time. For backtests, we use the date range you set. In practice, starting earlier and staying consistent usually matters more than timing.",
  },
  {
    question: "Analyze my portfolio",
    response:
      "Portfolio analysis is coming soon. For now you can use the Portfolio page to view your holdings and the DCA Backtest to simulate strategy performance. Connect your accounts when the feature is available.",
  },
  {
    question: "Is BTC a good DCA target?",
    response:
      "Bitcoin has been a common DCA choice due to high volatility and long-term growth in backtests. Past performance doesn't guarantee future results. Consider your risk tolerance and combine with other assets if needed.",
  },
]

const DEFAULT_MOCK_RESPONSE =
  "I'm analyzing your request... (This is a mock response from your AI Advisor)."

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI Advisor. How can I help you with your trading strategy today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  /** Send a user message and add a mock AI reply (optional canned response). */
  const sendMessage = (userText: string, mockResponse?: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    const reply = mockResponse ?? DEFAULT_MOCK_RESPONSE
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 800)
  }

  const handleSend = () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput("")
    sendMessage(text)
  }

  const handleQuickQuestion = (item: (typeof QUICK_QUESTIONS)[number]) => {
    sendMessage(item.question, item.response)
  }

  const handleExpand = () => {
    setIsOpen(false)
    navigate("/home/ai-advisor")
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat window */}
      {isOpen && (
        <div className="mb-4 w-[380px] h-[520px] bg-card border rounded-xl shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 duration-300">
          {/* Header */}
          <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="size-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  AI Advisor
                  <Sparkles className="size-3 text-primary" />
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-accent"
                onClick={handleExpand}
                title="Fullscreen"
              >
                <Maximize2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Message area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-2 max-w-[85%]",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center shrink-0 border",
                    msg.sender === "ai"
                      ? "bg-primary/10 text-primary border-border"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {msg.sender === "ai" ? <Bot className="size-4" /> : <User className="size-4" />}
                </div>
                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm border",
                    msg.sender === "ai"
                      ? "bg-muted text-foreground rounded-tl-none border-border"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick questions (mock): single row, scroll horizontally */}
          <div className="px-4 pb-2 border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Quick questions</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {QUICK_QUESTIONS.map((item) => (
                <Button
                  key={item.question}
                  variant="outline"
                  size="sm"
                  className="h-auto shrink-0 py-1.5 px-2.5 text-xs font-normal whitespace-nowrap"
                  onClick={() => handleQuickQuestion(item)}
                >
                  {item.question}
                </Button>
              ))}
            </div>
          </div>

          {/* Input area */}
          <div className="p-4 bg-muted/30 border-t">
            <div className="flex items-center gap-0 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="min-w-0 flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-md rounded-r-none"
              />
              <Button
                type="button"
                size="icon"
                className="size-9 shrink-0 rounded-l-none"
                onClick={handleSend}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="relative size-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        >
          <MessageSquare className="size-6" />
          <span className="absolute -top-0.5 -right-0.5 size-3 bg-destructive rounded-full border-2 border-background" />
        </Button>
      )}
    </div>
  )
}
