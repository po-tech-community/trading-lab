interface TooltipPayloadItem {
  value?: number;
  payload?: {
    close?: number;
  };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  assetLabel?: string;
}

/**
 * Custom tooltip for the portfolio trajectory chart.
 * Shows date, portfolio value, total invested, and unrealized profit at hover.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  assetLabel = "Coin",
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0]?.value ?? 0);
  const invested = Number(payload[1]?.value ?? 0);
  const close = Number(payload[0]?.payload?.close ?? 0);

  const formattedDate = new Date(String(label)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-background border p-3 rounded-md shadow-sm">
      <p className="text-xs text-muted-foreground mb-2">{formattedDate}</p>
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
          <span className="text-xs text-emerald-500">Unrealized profit</span>
          <span className="text-xs font-semibold text-emerald-500">
            +${(value - invested).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
