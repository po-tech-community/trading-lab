import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Minimize2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChartTooltip } from "./ChartTooltip"
import type { ChartDataPoint } from "./constants"

export interface PortfolioTrajectoryChartProps {
  /** Time-series data: date, invested, value */
  data: ChartDataPoint[]
  /** Whether the chart is in fullscreen mode */
  isFullscreen: boolean
  /** Toggle fullscreen */
  onFullscreenChange: () => void
  /** Subtitle under the chart title (e.g. date range) */
  chartDescription?: string
}

/**
 * Main area chart: portfolio value and cumulative invested over time.
 * Includes legend (Equity / Basis) and fullscreen toggle.
 */
export function PortfolioTrajectoryChart({
  data,
  isFullscreen,
  onFullscreenChange,
  chartDescription = "Performance visualization",
}: PortfolioTrajectoryChartProps) {
  return (
    <Card
      className={cn(
        "flex-1 bg-card relative overflow-hidden",
        isFullscreen && "min-h-[500px]"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <div>
          <CardTitle className="text-lg font-semibold">Portfolio trajectory</CardTitle>
          <CardDescription>{chartDescription}</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend: equity vs basis */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Equity</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-md bg-muted-foreground/20" />
              <span className="text-xs text-muted-foreground">Basis</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onFullscreenChange}>
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "w-full",
          isFullscreen ? "h-[calc(100vh-250px)]" : "h-[420px]"
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValueEnh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickFormatter={(str) => {
                try {
                  return new Date(str).toLocaleDateString("en-US", { month: "short" })
                } catch {
                  return str
                }
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickFormatter={(value) => `$${value}`}
              dx={-10}
            />
            <RechartsTooltip
              content={<ChartTooltip />}
              cursor={{
                stroke: "hsl(var(--primary))",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            {/* Equity curve (filled area) */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValueEnh)"
              animationDuration={800}
              activeDot={{
                r: 6,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 3,
              }}
            />
            {/* Cumulative invested (step line) */}
            <Area
              type="stepAfter"
              dataKey="invested"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              fill="transparent"
              strokeDasharray="6 6"
              opacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
