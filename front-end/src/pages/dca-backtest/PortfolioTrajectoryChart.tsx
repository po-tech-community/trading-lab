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
  const expandedData = data.flatMap((point, index) => {
    if (index === data.length - 1) return [point];

    const next = data[index + 1];
    const currentDelta = point.value - point.invested;
    const nextDelta = next.value - next.invested;

    // Insert a synthetic crossover point when profit/loss sign changes,
    // so colored segments connect continuously at breakeven.
    if (currentDelta * nextDelta < 0) {
      const ratio =
        Math.abs(currentDelta) / (Math.abs(currentDelta) + Math.abs(nextDelta));

      const pointTime = Date.parse(String(point.date));
      const nextTime = Date.parse(String(next.date));
      const interpolatedTime =
        Number.isNaN(pointTime) || Number.isNaN(nextTime)
          ? String(point.date)
          : new Date(pointTime + (nextTime - pointTime) * ratio).toISOString();

      const interpolatedValue =
        point.value + (next.value - point.value) * ratio;
      const interpolatedInvested =
        point.invested + (next.invested - point.invested) * ratio;
      const breakevenValue = (interpolatedValue + interpolatedInvested) / 2;

      const interpolatedClose =
        point.close + (next.close - point.close) * ratio;

      return [
        point,
        {
          date: interpolatedTime,
          value: breakevenValue,
          invested: breakevenValue,
          close: interpolatedClose,
        },
      ];
    }

    return [point];
  });

  const segmentedData = expandedData.map((point) => {
    const delta = point.value - point.invested;
    const epsilon = 0.01;
    const isBreakeven = Math.abs(delta) <= epsilon;

    return {
      ...point,
      valueProfit: delta >= 0 ? point.value : null,
      valueLoss: delta <= 0 ? point.value : null,
      valueBreakeven: isBreakeven ? point.value : null,
    };
  });

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
            data={segmentedData}
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
            {/* Hidden source line for stable tooltip payload */}
            <Line
              type="monotone"
              dataKey="value"
              name="Portfolio value"
              stroke="transparent"
              strokeWidth={0}
              legendType="none"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            {/* Portfolio value: losing segment */}
            <Line
              type="monotone"
              dataKey="valueLoss"
              name="Loss zone"
              stroke="rgb(239 68 68)"
              strokeWidth={3}
              animationDuration={800}
              dot={false}
              activeDot={{
                r: 6,
                fill: "rgb(239 68 68)",
                stroke: "hsl(var(--background))",
                strokeWidth: 3,
              }}
            />
            {/* Portfolio value: profitable segment */}
            <Line
              type="monotone"
              dataKey="valueProfit"
              name="Profit zone"
              stroke="rgb(16 185 129)"
              strokeWidth={3}
              animationDuration={800}
              dot={false}
              activeDot={{
                r: 6,
                fill: "rgb(16 185 129)",
                stroke: "hsl(var(--background))",
                strokeWidth: 3,
              }}
            />
            {/* Portfolio value: breakeven segment (rendered last so black stays on top at crossover) */}
            <Line
              type="monotone"
              dataKey="valueBreakeven"
              name="Breakeven zone"
              stroke="#111827"
              strokeWidth={3}
              animationDuration={800}
              dot={{ r: 3, fill: "#111827", stroke: "#111827" }}
              activeDot={{
                r: 6,
                fill: "#111827",
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
              opacity={0.4}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
