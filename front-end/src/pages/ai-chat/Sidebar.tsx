import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AiChatSidebarProps {
  sessions: Array<{ id: string; label: string }>;
  selectedSessionId: string;
  onSessionChange: (id: string) => void;
  onNewInvestigation: () => void;
}

/**
 * Sidebar for AI Studio. Offers a backtest selector and a new investigation reset.
 */
export function AiChatSidebar({
  sessions,
  selectedSessionId,
  onSessionChange,
  onNewInvestigation,
}: AiChatSidebarProps) {
  return (
    <Card className="hidden lg:flex flex-col w-80 overflow-hidden py-0">
      <div className="p-6 border-b border-border space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Load backtest
          </p>
          <p className="text-sm text-foreground/80">
            Attach the latest DCA or portfolio result to AI requests.
          </p>
        </div>

        <Select value={selectedSessionId} onValueChange={onSessionChange}>
          <SelectTrigger className="h-10 w-full rounded-md border border-input bg-background text-sm">
            <SelectValue placeholder="Select backtest session" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-primary/10">
            {sessions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CardContent className="flex-1 space-y-2 overflow-y-auto">
        <div className="p-3 rounded-md bg-muted cursor-pointer">
          <p className="text-xs text-primary mb-1">Current session</p>
          <p className="text-sm truncate">Market analysis v1.0</p>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <p className="text-xs text-muted-foreground mb-1">Yesterday</p>
            <p className="text-sm truncate text-muted-foreground">
              Historical DCA strategy {i}
            </p>
          </div>
        ))}
      </CardContent>
      <div className="p-6 mt-auto border-t border-border">
        <Button className="w-full" onClick={onNewInvestigation}>
          New investigation
        </Button>
      </div>
    </Card>
  )
}

