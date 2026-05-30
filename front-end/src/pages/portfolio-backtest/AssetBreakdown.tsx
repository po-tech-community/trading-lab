import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface AssetBreakdownItem {
  symbol: string;
  weight: number;
  invested: number;
  currentValue: number;
  returnPercentage: number;
}

export interface AssetBreakdownProps {
  items: AssetBreakdownItem[];
}

export default function AssetBreakdown({ items }: AssetBreakdownProps) {
  const totalCurrent = items.reduce((s, it) => s + (it.currentValue || 0), 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Per-asset breakdown</CardTitle>
        <CardDescription>ROI and contribution of each asset</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => {
          const pctContribution = (it.currentValue / totalCurrent) * 100;
          return (
            <div key={it.symbol} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10">
                    <div className="text-sm font-medium">{it.symbol}</div>
                    <div className="text-xs text-muted-foreground">{it.weight}%</div>
                  </div>
                  <div className="text-sm">
                    {it.currentValue?.toLocaleString ? `$${it.currentValue.toLocaleString()}` : ` $${it.currentValue}`}
                  </div>
                </div>
                <div className="text-sm font-semibold" style={{ minWidth: 80, textAlign: 'right' }}>
                  {it.returnPercentage >= 0 ? `+${it.returnPercentage.toFixed(1)}%` : `${it.returnPercentage.toFixed(1)}%`}
                </div>
              </div>

              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-2 bg-primary"
                  style={{ width: `${Math.max(2, Math.min(100, pctContribution))}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
