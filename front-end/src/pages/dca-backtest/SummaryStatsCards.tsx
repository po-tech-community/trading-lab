import { Card, CardContent } from "@/components/ui/card"
import { Wallet, TrendingUp, ArrowUpRight, DollarSign, Zap } from "lucide-react"
import type { BacktestSummary } from "@/lib/backtest-api"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function formatSignedCurrency(value: number): string {
  const abs = currency.format(Math.abs(value))
  return value >= 0 ? `+${abs}` : `-${currency.format(Math.abs(value))}`
}

export interface SummaryStatsCardsProps {
  summary: BacktestSummary | null
}

/**
 * Three summary cards: Total invested, Portfolio value, ROI.
 */
export function SummaryStatsCards({ summary }: SummaryStatsCardsProps) {
  const invested = summary?.totalInvested ?? null
  const portfolioValue = summary?.currentValue ?? null
  const roiPct = summary?.totalReturnPercentage ?? null
  const installments = summary?.numberOfPurchases ?? null
  const profit =
    invested !== null && portfolioValue !== null ? portfolioValue - invested : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {invested !== null ? currency.format(invested) : "—"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-primary/30" />
              {installments !== null ? `${installments} installments` : "—"}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 p-6 opacity-10">
            <DollarSign className="size-24" />
          </div>
        </CardContent>
      </Card>

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
              {portfolioValue !== null ? currency.format(portfolioValue) : "—"}
            </div>
            <div className="flex items-center gap-2">
              {roiPct !== null ? (
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-1 border border-emerald-500/20">
                  <ArrowUpRight className="h-3 w-3" />
                  {pct.format(roiPct / 100)}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 p-6 opacity-10 text-emerald-500">
            <TrendingUp className="size-24" />
          </div>
        </CardContent>
      </Card>

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
              {profit !== null ? formatSignedCurrency(profit) : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {profit !== null ? "Total profit generated" : "Run a backtest to see results"}
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
