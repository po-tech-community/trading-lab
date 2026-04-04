import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "./ChartTooltip";
import type { ChartDataPoint } from "./constants";

export interface PortfolioTrajectoryChartProps {
  /** Time-series data: date, invested, value */
  data: ChartDataPoint[];
  /** Whether the chart is in fullscreen mode */
  isFullscreen: boolean;
  /** Toggle fullscreen */
  onFullscreenChange: () => void;
  /** Subtitle under the chart title (e.g. date range) */
  chartDescription?: string;
  /** Asset label used in the tooltip, e.g. Bitcoin, Ethereum */
  assetLabel?: string;
}

/**
 * Main line chart: portfolio value and cumulative invested over time.
 * Includes legend and fullscreen toggle.
 */
export function PortfolioTrajectoryChart({
  data,
  isFullscreen,
  onFullscreenChange,
  chartDescription = "Performance visualization",
  assetLabel = "Coin",
}: PortfolioTrajectoryChartProps) {
  return (
    <Card
      className={cn(
        "flex-1 bg-card relative overflow-hidden",
        isFullscreen && "min-h-[500px]",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <div>
          <CardTitle className="text-lg font-semibold">
            Portfolio trajectory
          </CardTitle>
          <CardDescription>{chartDescription}</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">
                Portfolio value
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-md bg-muted-foreground/20" />
              <span className="text-xs text-muted-foreground">
                Total invested
              </span>
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
          isFullscreen ? "h-[calc(100vh-250px)]" : "h-[420px]",
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
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
                  return new Date(str).toLocaleDateString("en-US", {
                    month: "short",
                  });
                } catch {
                  return str;
                }
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickFormatter={(value) =>
                Number(value).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              }
              dx={-10}
            />
            <RechartsTooltip
              content={<ChartTooltip assetLabel={assetLabel} />}
              cursor={{
                stroke: "hsl(var(--primary))",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            {/* Portfolio value line */}
            <Line
              type="monotone"
              dataKey="value"
              name="Portfolio value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              animationDuration={800}
              dot={false}
              activeDot={{
                r: 6,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 3,
              }}
            />
            {/* Cumulative invested baseline (step line) */}
            <Line
              type="stepAfter"
              dataKey="invested"
              name="Total invested"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="6 6"
              opacity={0.4}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
