import React, { useState, useRef, useEffect } from "react"
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

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm analyzing your request... (This is a mock response from your AI Advisor).",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 1000)
  }

  const handleExpand = () => {
    setIsOpen(false)
    navigate("/home/ai-advisor/chat")
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[380px] h-[520px] bg-card/80 backdrop-blur-2xl border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 duration-300 ring-1 ring-primary/10">
          {/* Header */}
          <div className="p-4 bg-primary/10 border-b border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Bot className="size-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  AI Advisor
                  <Sparkles className="size-3 text-primary animate-pulse" />
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Online Now</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 rounded-full hover:bg-primary/10"
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

          {/* Message Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/10"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex items-start gap-2 max-w-[85%]",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                  msg.sender === "ai" ? "bg-primary/20 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"
                )}>
                  {msg.sender === "ai" ? <Bot className="size-4" /> : <User className="size-4" />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl text-sm shadow-sm",
                  msg.sender === "ai" 
                    ? "bg-muted/50 text-foreground rounded-tl-none border border-border/50" 
                    : "bg-primary text-primary-foreground rounded-tr-none shadow-primary/20"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-background/50 border-t border-primary/10">
            <div className="relative group">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..." 
                className="pr-12 h-12 bg-background border-primary/10 focus-visible:ring-primary/20 rounded-xl"
              />
              <Button 
                size="icon" 
                className="absolute right-1 top-1 size-10 rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                onClick={handleSend}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="size-14 rounded-full shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 transition-all transform hover:scale-110 active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquare className="size-7 fill-primary-foreground/10 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 size-4 bg-destructive rounded-full border-2 border-primary-foreground animate-bounce shadow-sm" />
        </Button>
      )}
    </div>
  )
}
