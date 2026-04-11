import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BacktestTrade } from "@/lib/backtest-api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatSignedCurrency(value: number): string {
  const abs = currency.format(Math.abs(value));
  return value >= 0 ? `+${abs}` : `-${abs}`;
}

export interface TradeHistoryTableProps {
  trades: BacktestTrade[];
}

export function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-semibold">Trade history</CardTitle>
        <CardDescription>
          Triggered sell actions from the latest backtest run.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 rounded-md border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5">
          <p>
            <span className="font-medium text-foreground">TP</span> = Take
            Profit (sell when profit reaches your threshold),{" "}
            <span className="font-medium text-foreground">SL</span>= Stop Loss
            (sell when drawdown reaches your threshold).
          </p>
          <p>
            <span className="font-medium text-foreground">Price</span> = asset
            market price at the trigger moment (USD per 1 unit, e.g. 1 BTC).
          </p>
          <p>
            <span className="font-medium text-foreground">Amount</span> =
            quantity sold (units of the asset, not USD).
          </p>
        </div>

        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sell trades were triggered in this run. Try a lower threshold,
            different date range, or a larger sell percentage.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type (TP/SL)</TableHead>
                <TableHead>Price (USD / unit)</TableHead>
                <TableHead>Amount (units sold)</TableHead>
                <TableHead>Realized Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {dateFormatter.format(new Date(trade.date))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === "takeProfit"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {trade.type === "takeProfit" ? "TP" : "SL"}
                    </span>
                  </TableCell>
                  <TableCell>{currency.format(trade.price)}</TableCell>
                  <TableCell>{trade.units.toFixed(6)}</TableCell>
                  <TableCell
                    className={
                      trade.profit >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {formatSignedCurrency(trade.profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
