import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LineChart, TrendingUp, ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_MARKETS = [
  { symbol: "BTC / USD", price: "$62,450", change: "+2.4%", direction: "up" as const, volume: "$1.2B" },
  { symbol: "ETH / USD", price: "$3,250", change: "-1.1%", direction: "down" as const, volume: "$650M" },
  { symbol: "AAPL", price: "$192.40", change: "+0.8%", direction: "up" as const, volume: "$8.1B" },
  { symbol: "TSLA", price: "$228.30", change: "+3.2%", direction: "up" as const, volume: "$6.4B" },
]

export default function MarketDataPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Market data (mock)"
        description="Lightweight snapshot of a few example markets. Wire this page to your data provider when ready."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Market overview
            </CardTitle>
            <CardDescription>High-level state of the example watchlist.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">3</span> markets up,{" "}
              <span className="font-medium">1</span> market down today.
            </p>
            <p className="text-muted-foreground">
              These numbers are purely illustrative and not connected to real-time feeds.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data source</CardTitle>
            <CardDescription>Where live prices would come from.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              In production, you might connect to an exchange (Binance, Coinbase, etc.), a market
              data API (Polygon, Alpha Vantage), or an internal pricing service.
            </p>
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <a href="#" onClick={(e) => e.preventDefault()}>
                View integration docs
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LineChart className="size-4" />
              Usage ideas
            </CardTitle>
            <CardDescription>How this page supports Trading Lab.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>• Inspect spot prices before configuring new DCA strategies.</p>
            <p>• Compare backtest results with current market context.</p>
            <p>• Later, drill into order books or historical candles.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watchlist (mock data)</CardTitle>
          <CardDescription>Static list of a few instruments with price and daily change.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground">
            <span>Market</span>
            <span>Last price</span>
            <span>24h change</span>
            <span>Volume</span>
          </div>
          {MOCK_MARKETS.map((m) => {
            const isUp = m.direction === "up"
            return (
              <div
                key={m.symbol}
                className="grid grid-cols-4 gap-4 items-center rounded-md border border-border/50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.symbol}</span>
                  <Badge variant="outline">Mock</Badge>
                </div>
                <span>{m.price}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    isUp ? "text-emerald-600" : "text-red-500"
                  )}
                >
                  {isUp ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {m.change}
                </span>
                <span className="text-xs text-muted-foreground">{m.volume}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

