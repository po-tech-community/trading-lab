import { useState, useRef, useEffect } from "react"
import { Sparkles, ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { AiChatSidebar } from "./ai-chat/Sidebar"
import { ChatPanel, type ChatMessage } from "./ai-chat/ChatPanel"
import { analyzeBacktest } from "@/lib/ai-api";

export default function AiChatPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
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

  const handleSend = async () => {
  if (!input.trim()) return;

  const userMsg: ChatMessage = {
    id: Date.now().toString(),
    text: input,
    sender: "user",
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMsg]);
  setInput("");

  try {
    const result = await analyzeBacktest({ userQuery: input.trim() });
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: result.advice,
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
  } catch {
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "Sorry, I couldn't reach the AI advisor right now. Please try again.",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
  }
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
        />
      </div>
    </div>
  )
}
