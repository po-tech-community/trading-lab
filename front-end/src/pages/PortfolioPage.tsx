/**
 * Portfolio Backtest Page
 *
 * Integrates the L2-FE-1 AssetList component via PortfolioConfigCard.
 * Users can build a multi-asset portfolio, validate that weights sum to 100%,
 * and submit a backtest run.
 *
 * HIGHLIGHTED CHANGES (L2-FE-1):
 *  - Replaced static mock layout with PortfolioConfigCard + AssetList
 *  - Added collapsible sidebar (mirrors DcaBacktestPage pattern)
 *  - Added submit handler wired to runPortfolioBacktest API
 *  - Retains mock summary cards as placeholders until L2-FE-3 is done
 */
 
import { useState } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PortfolioConfigCard } from "@/pages/portfolio-backtest/PortfolioConfigCard"
import { runPortfolioBacktest } from "@/lib/backtest-api"
import type { RunPortfolioBacktestRequestBody } from "@/lib/backtest-api"
 
export default function PortfolioPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
 
  async function handleSubmit(body: RunPortfolioBacktestRequestBody) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      // TODO (L2-FE-3): store result and render summary + chart
      await runPortfolioBacktest(body)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }
 
  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Backtest"
        description="Build a multi-asset DCA portfolio and simulate its historical performance."
      />
 
      {/* ── Main layout: sidebar + content ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
 
        {/* ── Left: Portfolio config with AssetList (L2-FE-1) ── */}
        <PortfolioConfigCard
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          isCollapsed={isCollapsed}
          onCollapsedChange={setIsCollapsed}
        />
 
        {/* ── Right: Results placeholder (to be replaced by L2-FE-3) ── */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total value</CardTitle>
                <CardDescription>Run a backtest to see results</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-muted-foreground">—</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total return</CardTitle>
                <CardDescription>vs. total invested</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-muted-foreground">—</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assets tracked</CardTitle>
                <CardDescription>in this simulation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-semibold text-muted-foreground">—</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Configure left →</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
 
          {/* Chart placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portfolio trajectory</CardTitle>
              <CardDescription>
                Chart will render here after running a backtest (L2-FE-3).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 rounded-md border border-dashed text-muted-foreground text-sm">
                Configure assets on the left and click &ldquo;Run portfolio backtest&rdquo;
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}