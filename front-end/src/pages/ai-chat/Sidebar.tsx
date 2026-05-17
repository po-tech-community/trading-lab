import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Session {
  id: string;
  label: string;
  createdAt?: string;
}

interface AiChatSidebarProps {
  sessions: Session[];
  selectedSessionId: string;
  onSessionChange: (id: string) => void;
  onNewInvestigation: () => void;
  onDeleteSession?: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AiChatSidebar({
  sessions,
  selectedSessionId,
  onSessionChange,
  onNewInvestigation,
  onDeleteSession,
}: AiChatSidebarProps) {
  const historySessions = sessions.filter((s) => s.id !== "none");

  return (
    <Card className="hidden lg:flex flex-col w-80 overflow-hidden py-0">
      <div className="p-6 border-b border-border space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Load backtest
          </p>
          <p className="text-sm text-foreground/80">
            Attach a past result to AI requests.
          </p>
        </div>

        <Select value={selectedSessionId} onValueChange={onSessionChange}>
          <SelectTrigger className="h-10 w-full rounded-md border border-input bg-background text-sm">
            <SelectValue placeholder="Select backtest session" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-primary/10">
            <SelectItem value="none">No backtest</SelectItem>
            {historySessions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {historySessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 px-4">
            Run a backtest to save it here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {historySessions.map((session) => (
              <li
                key={session.id}
                className={`flex items-start justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedSessionId === session.id ? "bg-muted" : ""
                }`}
                onClick={() => onSessionChange(session.id)}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{session.label}</p>
                  {session.createdAt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(session.createdAt)}
                    </p>
                  )}
                </div>
                {onDeleteSession && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <div className="p-6 mt-auto border-t border-border">
        <Button className="w-full" onClick={onNewInvestigation}>
          New investigation
        </Button>
      </div>
    </Card>
  )
}
