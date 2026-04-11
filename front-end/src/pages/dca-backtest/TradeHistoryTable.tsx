import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { BacktestTrade } from "@/lib/backtest-api"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

function formatSignedCurrency(value: number): string {
  const abs = currency.format(Math.abs(value))
  return value >= 0 ? `+${abs}` : `-${abs}`
}

export interface TradeHistoryTableProps {
  trades: BacktestTrade[]
}

export function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  if (trades.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Realized Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade, index) => (
              <TableRow key={index}>
                <TableCell>{dateFormatter.format(new Date(trade.date))}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.type === 'takeProfit'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {trade.type === 'takeProfit' ? 'TP' : 'SL'}
                  </span>
                </TableCell>
                <TableCell>{currency.format(trade.price)}</TableCell>
                <TableCell>{trade.units.toFixed(6)}</TableCell>
                <TableCell className={trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatSignedCurrency(trade.profit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}