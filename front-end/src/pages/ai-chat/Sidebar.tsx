import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * Static sidebar with mock conversation history and a search input.
 * Replace contents with real sessions/history when backend is wired up.
 */
export function AiChatSidebar() {
  return (
    <Card className="hidden lg:flex flex-col w-80 overflow-hidden py-0">
      <div className="p-6 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-10 h-9" placeholder="Search conversations..." />
        </div>
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
        <Button className="w-full">New investigation</Button>
      </div>
    </Card>
  )
}

