import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio overview</h1>
          <p className="text-sm text-muted-foreground">
            High-level snapshot of your current holdings and DCA strategies.
          </p>
        </div>
        <Button variant="outline">Export summary</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total value</CardTitle>
            <CardDescription>Mock data for now</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">$24,500.00</p>
            <p className="text-sm text-emerald-600 mt-1">+12.4% all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invested capital</CardTitle>
            <CardDescription>Cumulative contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">$18,200.00</p>
            <p className="text-sm text-muted-foreground mt-1">Across all active strategies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active strategies</CardTitle>
            <CardDescription>DCA and manual positions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">4</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">BTC DCA</Badge>
              <Badge variant="outline">ETH DCA</Badge>
              <Badge variant="outline">Tech stocks</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Positions (mock)</CardTitle>
          <CardDescription>
            Replace this table with live data once services and hooks are ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground mb-2">
            <span>Asset</span>
            <span>Allocation</span>
            <span>Invested</span>
            <span>P&amp;L</span>
          </div>
          <div className="grid grid-cols-4 gap-4 py-2 text-sm border-t">
            <span className="font-medium text-foreground">Bitcoin (BTC)</span>
            <span>40%</span>
            <span>$7,200.00</span>
            <span className="text-emerald-600">+ $1,050.00</span>
          </div>
          <div className="grid grid-cols-4 gap-4 py-2 text-sm border-t">
            <span className="font-medium text-foreground">Ethereum (ETH)</span>
            <span>25%</span>
            <span>$4,500.00</span>
            <span className="text-emerald-600">+ $620.00</span>
          </div>
          <div className="grid grid-cols-4 gap-4 py-2 text-sm border-t">
            <span className="font-medium text-foreground">Tech basket</span>
            <span>35%</span>
            <span>$6,500.00</span>
            <span className="text-red-500">- $280.00</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Strategy performance (mock)</CardTitle>
            <CardDescription>
              Quick view of how each DCA strategy is doing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">BTC weekly DCA</p>
                <p className="text-xs text-muted-foreground">Started Jan 2023 · 18 fills</p>
              </div>
              <Badge variant="outline">Stable</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">ETH monthly DCA</p>
                <p className="text-xs text-muted-foreground">Higher volatility profile</p>
              </div>
              <Badge variant="outline">Aggressive</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tech basket</p>
                <p className="text-xs text-muted-foreground">Mix of large-cap stocks</p>
              </div>
              <Badge variant="outline">Balanced</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity (mock)</CardTitle>
            <CardDescription>
              Last few portfolio events. Replace with a real activity feed later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Filled BTC DCA order</p>
              <p className="text-xs text-muted-foreground">0.0034 BTC bought for $120 · 2 hours ago</p>
            </div>
            <div>
              <p className="font-medium">Rebalanced tech basket</p>
              <p className="text-xs text-muted-foreground">Shifted 5% from AAPL to NVDA · Yesterday</p>
            </div>
            <div>
              <p className="font-medium">Created new ETH DCA strategy</p>
              <p className="text-xs text-muted-foreground">$150 per month starting next cycle</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

