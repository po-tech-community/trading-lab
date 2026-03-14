import { Card, CardContent } from "@/components/ui/card"
import { Wallet, TrendingUp, ArrowUpRight, DollarSign, Zap } from "lucide-react"

/**
 * Mock summary stats for the current backtest run.
 * Replace with real computed values when backend/engine is connected.
 */
const MOCK_STATS = {
  invested: { value: "$1,200.00", installments: 12 },
  portfolioValue: { value: "$2,150.42", changePercent: "+79.2%" },
  roi: { value: "+$950.42", label: "Total profit generated" },
}

/**
 * Three summary cards: Total invested, Portfolio value, ROI.
 * Used below the strategy config and above the chart.
 */
export function SummaryStatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total invested */}
      <Card className="relative h-full overflow-hidden border bg-card p-0">
        <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Wallet className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Total invested</span>
              <span className="text-xs text-muted-foreground">
                Contributions over the selected period
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold tabular-nums">
              {MOCK_STATS.invested.value}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-primary/30" />
              {MOCK_STATS.invested.installments} installments
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 p-6 opacity-10">
            <DollarSign className="size-24" />
          </div>
        </CardContent>
      </Card>

      {/* Portfolio value */}
      <Card className="relative h-full overflow-hidden border bg-card p-0">
        <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Portfolio value</span>
              <span className="text-xs text-muted-foreground">
                Current value of recurring buys
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold tabular-nums text-emerald-500">
              {MOCK_STATS.portfolioValue.value}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-1 border border-emerald-500/20">
                <ArrowUpRight className="h-3 w-3" />
                {MOCK_STATS.portfolioValue.changePercent}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 p-6 opacity-10 text-emerald-500">
            <TrendingUp className="size-24" />
          </div>
        </CardContent>
      </Card>

      {/* ROI */}
      <Card className="relative h-full overflow-hidden border bg-card p-0">
        <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-orange-500/10 text-orange-500">
              <ArrowUpRight className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">ROI</span>
              <span className="text-xs text-muted-foreground">
                Total profit from this strategy
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold tabular-nums text-orange-500">
              {MOCK_STATS.roi.value}
            </div>
            <div className="text-xs text-muted-foreground">
              {MOCK_STATS.roi.label}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 p-6 opacity-10 text-orange-500">
            <Zap className="size-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
