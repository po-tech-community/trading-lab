import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Maximize2, Send, Bot, Sparkles, User, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { analyzeBacktest } from "@/lib/ai-api"

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

const QUICK_QUESTIONS = [
  "What is DCA?",
  "Best time to invest?",
  "Is BTC a good DCA target?",
  "How does stop-loss affect DCA returns?",
]

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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

  const addMessage = (text: string, sender: "user" | "ai") => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text, sender, timestamp: new Date() },
    ])
  }

  const sendMessage = async (userText: string) => {
    addMessage(userText, "user")
    setIsLoading(true)
    try {
      const result = await analyzeBacktest({ userQuery: userText })
      addMessage(result.advice, "ai")
    } catch (err) {
      console.error("[FloatingAiChat] analyzeBacktest failed:", err)
      const status = (err as { status?: number }).status
      const msg =
        status === 401
          ? "Please log in to use the AI Advisor."
          : status === 429
            ? "Too many requests. Please wait a moment and try again."
            : status === 503
              ? "AI service is not configured (missing API key)."
              : "Sorry, I couldn't reach the AI advisor right now. Please try again."
      addMessage(msg, "ai")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput("")
    void sendMessage(text)
  }

  const handleQuickQuestion = (question: string) => {
    void sendMessage(question)
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

          {/* Quick questions */}
          <div className="px-4 pb-2 border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Quick questions</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {QUICK_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-auto shrink-0 py-1.5 px-2.5 text-xs font-normal whitespace-nowrap"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
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
                disabled={isLoading}
                className="min-w-0 flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-md rounded-r-none"
              />
              <Button
                type="button"
                size="icon"
                className="size-9 shrink-0 rounded-l-none"
                onClick={handleSend}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
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
