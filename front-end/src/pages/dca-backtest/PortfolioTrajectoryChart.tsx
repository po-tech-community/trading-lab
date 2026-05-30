import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceDot,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
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
import type { BacktestTrade } from "@/lib/backtest-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssetSeriesOption {
  symbol: string;
  label: string;
  data: ChartDataPoint[];
}

const ALL_SERIES_VALUE = "__ALL__";

export interface PortfolioTrajectoryChartProps {
  /** Time-series data: date, invested, value */
  data: ChartDataPoint[];
  /** Sell trades from smart triggers used for marker rendering */
  trades?: BacktestTrade[];
  /** Whether the chart is in fullscreen mode */
  isFullscreen: boolean;
  /** Toggle fullscreen */
  onFullscreenChange: () => void;
  /** Subtitle under the chart title (e.g. date range) */
  chartDescription?: string;
  /** Asset label used in the tooltip, e.g. Bitcoin, Ethereum */
  assetLabel?: string;
  /** Optional per-asset series for portfolio mode (enables aggregate/asset switcher UI). */
  assetSeriesOptions?: AssetSeriesOption[];
}

/**
 * Main line chart: portfolio value and cumulative invested over time.
 * Includes legend and fullscreen toggle.
 */
export function PortfolioTrajectoryChart({
  data,
  trades = [],
  isFullscreen,
  onFullscreenChange,
  chartDescription = "Performance visualization",
  assetLabel = "Coin",
  assetSeriesOptions,
}: PortfolioTrajectoryChartProps) {
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] =
    useState<string>(ALL_SERIES_VALUE);

  const hasAssetBreakdown = (assetSeriesOptions?.length ?? 0) > 0;

  useEffect(() => {
    if (!hasAssetBreakdown) {
      setSelectedSeries(ALL_SERIES_VALUE);
      return;
    }

    if (selectedSeries === ALL_SERIES_VALUE) return;

    const exists = assetSeriesOptions?.some(
      (option) => option.symbol === selectedSeries,
    );
    if (!exists) {
      setSelectedSeries(ALL_SERIES_VALUE);
    }
  }, [assetSeriesOptions, hasAssetBreakdown, selectedSeries]);

  const selectedAssetOption =
    selectedSeries === ALL_SERIES_VALUE
      ? undefined
      : assetSeriesOptions?.find((option) => option.symbol === selectedSeries);

  const activeData = selectedAssetOption ? selectedAssetOption.data : data;

  const tooltipAssetLabel = selectedAssetOption
    ? selectedAssetOption.label
    : assetLabel;

  const valueLegendLabel = selectedAssetOption
    ? `${selectedAssetOption.symbol} value`
    : "Portfolio value";

  const investedLegendLabel = selectedAssetOption
    ? `${selectedAssetOption.symbol} invested`
    : "Total invested";

  const showPriceInTooltip = true;

  const expandedData = activeData.flatMap((point, index) => {
    if (index === activeData.length - 1) return [point];

    const next = activeData[index + 1];
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

  const valueByDay = new Map<string, number>();
  for (const point of activeData) {
    valueByDay.set(point.date, point.value);
  }

  const tradeMarkers = trades
    .map((trade) => {
      const date = new Date(trade.date).toISOString().slice(0, 10);
      const value = valueByDay.get(date);
      if (value === undefined) return null;

      return {
        id: `${trade.type}-${trade.date}-${trade.units}`,
        date,
        value,
        type: trade.type,
        units: trade.units,
        profit: trade.profit,
        price: trade.price,
      };
    })
    .filter((marker): marker is NonNullable<typeof marker> => marker !== null);

  /**
   * Build a Map<YYYY-MM-DD, BacktestTrade[]> so the tooltip can look up
   * whether any TP/SL fired on the date the cursor is currently hovering.
   */
  const tradesByDate = useMemo(() => {
    const map = new Map<string, BacktestTrade[]>();
    for (const trade of trades) {
      const date = new Date(trade.date).toISOString().slice(0, 10);
      const existing = map.get(date) ?? [];
      existing.push(trade);
      map.set(date, existing);
    }
    return map;
  }, [trades]);

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
            {selectedAssetOption
              ? `${selectedAssetOption.symbol} trajectory`
              : "Portfolio trajectory"}
          </CardTitle>
          <CardDescription>{chartDescription}</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {hasAssetBreakdown && (
            <div className="hidden md:flex items-center gap-2">
              <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SERIES_VALUE}>All assets</SelectItem>
                  {assetSeriesOptions?.map((option) => (
                    <SelectItem key={option.symbol} value={option.symbol}>
                      By asset: {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Legend */}
          <div className="hidden xl:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">
                {valueLegendLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-md bg-muted-foreground/20" />
              <span className="text-xs text-muted-foreground">
                {investedLegendLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">TP sell</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-xs text-muted-foreground">SL sell</span>
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

            {/*
             * Pass tradesByDate into the tooltip so it can render trade details
             * when the cursor lands on a sell marker date (L3-FE-2).
             */}

            <RechartsTooltip
              content={
                <ChartTooltip
                  assetLabel={tooltipAssetLabel}
                  tradesByDate={tradesByDate}
                  valueLabel={valueLegendLabel}
                  investedLabel={investedLegendLabel}
                  showPrice={showPriceInTooltip}
                />
              }
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
              name={valueLegendLabel}
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
              name={investedLegendLabel}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              opacity={0.4}
              dot={false}
            />
            {tradeMarkers.map((marker) => (
              <ReferenceDot
                key={marker.id}
                x={marker.date}
                y={marker.value}
                r={hoveredMarkerId === marker.id ? 7 : 5}
                fill={
                  marker.type === "takeProfit"
                    ? "rgb(16 185 129)"
                    : "rgb(244 63 94)"
                }
                stroke={
                  hoveredMarkerId === marker.id
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--background))"
                }
                strokeWidth={hoveredMarkerId === marker.id ? 2.5 : 2}
                ifOverflow="hidden"
                onMouseEnter={() => setHoveredMarkerId(marker.id)}
                onMouseLeave={() => setHoveredMarkerId(null)}
                shape={(props: { cx?: number; cy?: number }) => {
                  const cx = props.cx ?? 0;
                  const cy = props.cy ?? 0;
                  const isHovered = hoveredMarkerId === marker.id;
                  const markerLabel =
                    `${marker.type === "takeProfit" ? "TP" : "SL"} trigger\n` +
                    `Date: ${marker.date}\n` +
                    `Price: $${marker.price.toFixed(2)}\n` +
                    `Amount sold: ${marker.units.toFixed(6)}\n` +
                    `Realized profit: ${marker.profit >= 0 ? "+" : ""}$${marker.profit.toFixed(2)}`;
                  void markerLabel;

                  return (
                    <g>
                      {/* Small label above the dot */}
                      <text
                        x={cx}
                        y={cy - 10}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        fill={
                          marker.type === "takeProfit"
                            ? "rgb(16 185 129)"
                            : "rgb(244 63 94)"
                        }
                        style={{ pointerEvents: "none" }}
                      >
                        {marker.type === "takeProfit" ? "TP" : "SL"}
                      </text>
                      {/* The dot itself */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 7 : 5}
                        fill={
                          marker.type === "takeProfit"
                            ? "rgb(16 185 129)"
                            : "rgb(244 63 94)"
                        }
                        stroke={
                          isHovered
                            ? "hsl(var(--foreground))"
                            : "hsl(var(--background))"
                        }
                        strokeWidth={isHovered ? 2.5 : 2}
                        onMouseEnter={() => setHoveredMarkerId(marker.id)}
                        onMouseLeave={() => setHoveredMarkerId(null)}
                      />
                    </g>
                  );
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
