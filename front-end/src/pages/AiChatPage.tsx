import React, { useState, useRef, useEffect } from "react"
import { Send, Bot, Sparkles, User, ChevronLeft, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

export default function AiChatPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to the Fullscreen AI Advisor! How can I help you analyze the markets today?",
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
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm processing your request in high-priority mode. (Full-page advisor active).",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 800)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-sm">
            <Sparkles className="size-4 fill-primary" />
            Advanced Intelligence
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            AI Advisor Studio
          </h1>
          <p className="text-muted-foreground">
            Experience the full power of our analytical engine in this dedicated workspace.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="size-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Sidebar / History (placeholder) */}
        <Card className="hidden lg:flex flex-col w-80 overflow-hidden">
          <div className="p-6 border-b border-primary/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input className="pl-10 h-9" placeholder="Search conversations..." />
            </div>
          </div>
          <CardContent className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="p-3 rounded-md bg-muted cursor-pointer">
              <p className="text-xs text-primary mb-1">Current session</p>
              <p className="text-sm truncate">Market analysis v1.0</p>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-md hover:bg-muted cursor-pointer transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Yesterday</p>
                <p className="text-sm truncate text-muted-foreground">
                  Historical DCA strategy {i}
                </p>
              </div>
            ))}
          </CardContent>
          <div className="p-6 mt-auto border-t border-primary/5">
            <Button variant="default" className="w-full">
              New investigation
            </Button>
          </div>
        </Card>

        {/* Main chat interface */}
        <Card className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between bg-card">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Bot className="size-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight">AI advisor</h3>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-600">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 relative"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 max-w-[70%]",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "size-8 rounded-full flex items-center justify-center shrink-0 border",
                  msg.sender === "ai" 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {msg.sender === "ai" ? <Bot className="size-4" /> : <User className="size-4" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.sender === "ai" 
                    ? "bg-card border text-foreground" 
                    : "bg-primary text-primary-foreground"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="p-6 bg-card border-t relative">
            <div className="relative max-w-3xl mx-auto">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask your AI Advisor anything..." 
                className="pr-12 h-11"
              />
              <Button 
                size="icon" 
                className="absolute right-1.5 top-1.5 size-8"
                onClick={handleSend}
              >
                <Send className="size-4" />
              </Button>
            </div>
            <p className="text-[10px] text-center mt-3 text-muted-foreground">
              Powered by Quantum Labs AI · Experimental model v2.4
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
