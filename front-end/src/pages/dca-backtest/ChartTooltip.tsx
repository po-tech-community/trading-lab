import type { BacktestTrade } from "@/lib/backtest-api";

export interface TooltipPayloadItem {
  value?: number;
  dataKey?: string;
  payload?: {
    close?: number;
    invested?: number;
    value?: number;
  };
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  assetLabel?: string;
  tradesByDate?: Map<string, BacktestTrade[]>;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Custom tooltip for the portfolio trajectory chart.
 * Shows date, portfolio value, total invested, and unrealized profit at hover.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  assetLabel = "Coin",
  tradesByDate,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const basePayload = payload[0]?.payload;
  const portfolioPoint = payload.find((item) => item.dataKey === "value");
  const investedPoint = payload.find((item) => item.dataKey === "invested");

  const value = Number(portfolioPoint?.value ?? basePayload?.value ?? 0);
  const invested = Number(investedPoint?.value ?? basePayload?.invested ?? 0);
  const close = Number(basePayload?.close ?? 0);

  const formattedDate = new Date(String(label)).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const profit = value - invested;
  const profitClass =
    profit > 0
      ? "text-emerald-500"
      : profit < 0
        ? "text-red-500"
        : "text-foreground";
  const profitLabel =
    profit > 0
      ? "Unrealized profit"
      : profit < 0
        ? "Unrealized loss"
        : "Breakeven";
  const profitDisplay =
    profit === 0
      ? "$0"
      : `${profit > 0 ? "+" : "-"}$${Math.abs(profit).toLocaleString()}`;

  
  // Sell trades for this hovered date
  const dateKey = String(label).slice(0, 10); // normalise to YYYY-MM-DD
  const tradesOnDate = tradesByDate?.get(dateKey) ?? [];


  return (
    <div className="bg-background border p-3 rounded-md shadow-sm min-w-[220px]">
      <p className="text-xs text-muted-foreground mb-2">{formattedDate}</p>
 
      {/* Standard portfolio metrics */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-8">
          <span className="text-sm flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            Portfolio value
          </span>
          <span className="text-sm font-semibold text-primary">
            ${value.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-8">
          <span className="text-sm flex items-center gap-2 text-muted-foreground">
            <div className="size-2 rounded-full bg-muted-foreground/40" />
            Total invested
          </span>
          <span className="text-sm">${invested.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-8">
          <span className="text-sm flex items-center gap-2 text-muted-foreground">
            <div className="size-2 rounded-full bg-amber-500" />
            {assetLabel} price
          </span>
          <span className="text-sm text-amber-600">
            {close > 0 ? `$${close.toLocaleString()}` : "—"}
          </span>
        </div>
        <div className="pt-1.5 mt-1.5 border-t border-border flex items-center justify-between">
          <span className={`text-xs ${profitClass}`}>{profitLabel}</span>
          <span className={`text-xs font-semibold ${profitClass}`}>
            {profitDisplay}
          </span>
        </div>
      </div>
 
      {/* Sell trade details — only rendered when a TP/SL fired on this date */}
      {tradesOnDate.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {tradesOnDate.map((trade, i) => {
            const isTp = trade.type === "takeProfit";
            const badgeClass = isTp
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300";
            const dotColor = isTp ? "bg-emerald-500" : "bg-rose-500";
            const profitColor =
              trade.profit >= 0 ? "text-emerald-500" : "text-rose-500";
 
            return (
              <div key={i} className="space-y-1">
                {/* Badge header */}
                <div className="flex items-center gap-1.5">
                  <div className={`size-2 rounded-full ${dotColor}`} />
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badgeClass}`}
                  >
                    {isTp ? "TAKE PROFIT" : "STOP LOSS"} trigger
                  </span>
                </div>
 
                {/* Trade details */}
                <div className="pl-3.5 space-y-0.5 text-xs">
                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">Sell price</span>
                    <span className="font-medium">
                      {currency.format(trade.price)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">Units sold</span>
                    <span className="font-medium">
                      {trade.units.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">
                      Realized profit
                    </span>
                    <span className={`font-semibold ${profitColor}`}>
                      {trade.profit >= 0 ? "+" : ""}
                      {currency.format(trade.profit)}
                    </span>
                  </div>
                </div>
 
                {/* Divider between multiple trades on same day */}
                {i < tradesOnDate.length - 1 && (
                  <div className="border-t border-border/50 pt-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
 
