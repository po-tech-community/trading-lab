import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Minimize2, Maximize2, Zap } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/common/PageHeader"

// DCA Backtest feature components
import { MOCK_CHART_DATA } from "./dca-backtest/constants"
import { StrategyConfigCard } from "./dca-backtest/StrategyConfigCard"
import { SummaryStatsCards } from "./dca-backtest/SummaryStatsCards"
import { StrategyPresetsCard } from "./dca-backtest/StrategyPresetsCard"
import { PortfolioTrajectoryChart } from "./dca-backtest/PortfolioTrajectoryChart"

/**
 * DCA Backtest page: simulate recurring investments over historical data.
 *
 * Layout:
 * - Page header with title and fullscreen toggle
 * - Left: Strategy config card (asset, amount, frequency, date range)
 * - Right: Summary stats (invested, value, ROI), presets, and trajectory chart
 *
 * State is local for now; replace with API/hooks when backend is ready.
 */
export default function DcaBacktestPage() {
  const [asset, setAsset] = useState("BTC")
  const [amount, setAmount] = useState("100")
  const [frequency, setFrequency] = useState("weekly")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleCalculate = () => {
    console.log(`Calculating returns for ${asset} at ${amount}/per ${frequency}`)
    // TODO: call backtest API or local engine
  }

  return (
    <TooltipProvider>
      {/* Fullscreen mode: fixed overlay; otherwise normal flow */}
      <div
        className={cn(
          "flex flex-col gap-4 pb-10",
          isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""
        )}
      >
        {/* Page title, description, and fullscreen entry/exit */}
        <PageHeader
          label="Simulator engine v1.0"
          icon={Zap}
          title="DCA Backtest"
          description="Analyze the historical performance of recurring investments with our high-precision simulation engine."
          actions={
            isFullscreen ? (
              <Button variant="outline" onClick={() => setIsFullscreen(false)}>
                <Minimize2 className="mr-2 h-4 w-4" />
                Exit fullscreen
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Fullscreen
              </Button>
            )
          }
        />

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Left: strategy parameters (collapsible on small screens) */}
          <StrategyConfigCard
            asset={asset}
            onAssetChange={setAsset}
            amount={amount}
            onAmountChange={setAmount}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            onCalculate={handleCalculate}
            isCollapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
          />

          {/* Right: results (stats, presets, chart) */}
          <div className="flex-1 flex flex-col gap-4 w-full overflow-hidden">
            {/* Invested / Value / ROI summary (mock values) */}
            <SummaryStatsCards />

            {/* Quick preset buttons (mock: do not update form yet) */}
            <StrategyPresetsCard />

            {/* Main trajectory chart with fullscreen support */}
            <PortfolioTrajectoryChart
              data={MOCK_CHART_DATA}
              isFullscreen={isFullscreen}
              onFullscreenChange={() => setIsFullscreen(!isFullscreen)}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
