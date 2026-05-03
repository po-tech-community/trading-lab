import { forwardRef } from "react";
import type { ForwardedRef, KeyboardEvent } from "react";
import { Bot, User, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

/**
 * Right-hand chat panel for the AI Advisor:
 * - Small header with avatar and status.
 * - Scrollable message list.
 * - Single-line text input with send button.
 */
export const ChatPanel = forwardRef<HTMLDivElement, ChatPanelProps>(
  (
    { messages, input, onInputChange, onSend },
    scrollRef: ForwardedRef<HTMLDivElement>,
  ) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSend();
      }
    };

    return (
      <Card className="flex-1 flex flex-col overflow-hidden relative gap-0 py-0">
        {/* Panel header */}
        <div className="p-6 border-b flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Bot className="size-8" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight">
                AI advisor
              </h3>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 relative"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3 max-w-[70%]",
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "",
              )}
            >
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center shrink-0 border",
                  msg.sender === "ai"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {msg.sender === "ai" ? (
                  <Bot className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.sender === "ai"
                    ? "bg-card border text-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 bg-card border-t relative">
          <div className="relative max-w-3xl mx-auto flex items-center gap-0 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI Advisor anything..."
              className="min-w-0 flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-md rounded-r-none h-9"
            />
            <Button
              type="button"
              size="icon"
              className="size-9 shrink-0 rounded-l-none"
              onClick={onSend}
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-center mt-3 text-muted-foreground">
            Powered by Quantum Labs AI · Experimental model v2.4
          </p>
        </div>
      </Card>
    );
  },
);

ChatPanel.displayName = "ChatPanel";
