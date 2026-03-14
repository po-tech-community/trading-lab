import type { TooltipProps } from "recharts"

/**
 * Custom tooltip for the portfolio trajectory chart.
 * Shows date, portfolio value, total invested, and unrealized profit at hover.
 */
export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  const formattedDate = new Date(label).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })

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
            ${payload[0].value.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-8">
          <span className="text-sm flex items-center gap-2 text-muted-foreground">
            <div className="size-2 rounded-full bg-muted-foreground/40" />
            Total invested
          </span>
          <span className="text-sm">${payload[1].value.toLocaleString()}</span>
        </div>
        <div className="pt-1.5 mt-1.5 border-t border-border flex items-center justify-between">
          <span className="text-xs text-emerald-500">Unrealized profit</span>
          <span className="text-xs font-semibold text-emerald-500">
            +${(payload[0].value - payload[1].value).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
