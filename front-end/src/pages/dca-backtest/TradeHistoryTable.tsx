import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  mode?: "single" | "portfolio";
  portfolioSymbols?: string[];
  pageSize?: number;
}

export function TradeHistoryTable({
  trades,
  mode = "single",
  portfolioSymbols: _portfolioSymbols = [],
  pageSize = 10,
}: TradeHistoryTableProps) {
  const isPortfolio = mode === "portfolio";
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(trades.length / pageSize));

  const pagedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return trades.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, trades]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setExpandedRows(new Set());
  }, [currentPage]);

  function toggleRow(rowId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Trade history
          {isPortfolio && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-4 text-muted-foreground/70 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[280px]">
                Portfolio smart triggers are evaluated at total portfolio level.
                When triggered, sell action is applied proportionally across all
                assets in the portfolio.
              </TooltipContent>
            </Tooltip>
          )}
        </CardTitle>
        <CardDescription>
          {isPortfolio
            ? "Triggered sell actions from the latest portfolio backtest run."
            : "Triggered sell actions from the latest backtest run."}
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
          {isPortfolio && (
            <p>
              <span className="font-medium text-foreground">
                Portfolio mode note
              </span>
              : Trigger conditions are checked on total portfolio performance,
              and each triggered sell is distributed proportionally across all
              configured assets. Open each row to see per-asset execution
              details (symbol, sell price, units sold, realized profit).
            </p>
          )}
        </div>

        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sell trades were triggered in this run. Try a lower threshold,
            different date range, or a larger sell percentage.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type (TP/SL)</TableHead>
                  <TableHead>
                    {isPortfolio ? (
                      <span className="inline-flex items-center gap-1">
                        Avg sell price (USD / unit)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3.5 text-muted-foreground/70 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[300px]">
                            Weighted-average sell price across all asset
                            executions in this portfolio trigger.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    ) : (
                      "Price (USD / unit)"
                    )}
                  </TableHead>
                  <TableHead>
                    {isPortfolio ? (
                      <span className="inline-flex items-center gap-1">
                        Total units sold
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3.5 text-muted-foreground/70 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[320px]">
                            Aggregate units sold (sum of sold units from all
                            assets). Units are not from a single symbol; open
                            row details for per-asset units.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    ) : (
                      "Amount (units sold)"
                    )}
                  </TableHead>
                  <TableHead>Realized Profit</TableHead>
                  {isPortfolio && (
                    <TableHead className="w-[120px] min-w-[120px] max-w-[120px]" />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedTrades.map((trade, index) => {
                  const hasAssetExecutions =
                    isPortfolio && (trade.assetExecutions?.length ?? 0) > 0;
                  const rowId = `${trade.date}-${(currentPage - 1) * pageSize + index}`;
                  const isExpanded = expandedRows.has(rowId);
                  const detailColSpan = isPortfolio ? 6 : 5;

                  return (
                    <>
                      <TableRow
                        key={`trade-${index}`}
                        className="group/trade-row"
                      >
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
                            trade.profit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {formatSignedCurrency(trade.profit)}
                        </TableCell>
                        {isPortfolio && (
                          <TableCell className="w-[120px] min-w-[120px] max-w-[120px] text-right">
                            {hasAssetExecutions ? (
                              <div className="relative h-7">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className={`absolute right-0 top-0 h-7 overflow-hidden justify-start transition-all duration-300 ease-out ${
                                    isExpanded
                                      ? "px-2"
                                      : "px-1.5 group-hover/trade-row:px-2 focus-visible:px-2"
                                  }`}
                                  onClick={() => toggleRow(rowId)}
                                  aria-label={
                                    isExpanded
                                      ? "Collapse per-asset details"
                                      : "Expand per-asset details"
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="size-4 shrink-0" />
                                  ) : (
                                    <ChevronRight className="size-4 shrink-0" />
                                  )}
                                  <span
                                    className={`ml-1.5 whitespace-nowrap text-[11px] transition-all duration-300 ease-out ${
                                      isExpanded
                                        ? "opacity-100 translate-x-0 max-w-[90px]"
                                        : "opacity-0 -translate-x-1 max-w-0 group-hover/trade-row:opacity-100 group-hover/trade-row:translate-x-0 group-hover/trade-row:max-w-[90px] group-focus-visible:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:max-w-[90px]"
                                    }`}
                                  >
                                    {isExpanded
                                      ? "Close details"
                                      : "View details"}
                                  </span>
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        )}
                      </TableRow>

                      {hasAssetExecutions && isExpanded && (
                        <TableRow key={`trade-${index}-executions`}>
                          <TableCell
                            colSpan={detailColSpan}
                            className="bg-muted/20"
                          >
                            <div className="text-xs text-muted-foreground mb-2">
                              Per-asset execution details
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-muted-foreground">
                                    <th className="pr-4 pb-1 font-medium">
                                      Asset
                                    </th>
                                    <th className="pr-4 pb-1 font-medium">
                                      Sell price
                                    </th>
                                    <th className="pr-4 pb-1 font-medium">
                                      Units sold
                                    </th>
                                    <th className="pr-4 pb-1 font-medium">
                                      Proceeds
                                    </th>
                                    <th className="pb-1 font-medium">
                                      Realized profit
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {trade.assetExecutions?.map((execution) => (
                                    <tr
                                      key={`${trade.date}-${execution.symbol}`}
                                    >
                                      <td className="pr-4 py-0.5 font-medium text-foreground">
                                        {execution.symbol}
                                      </td>
                                      <td className="pr-4 py-0.5">
                                        {currency.format(execution.price)}
                                      </td>
                                      <td className="pr-4 py-0.5">
                                        {execution.units.toFixed(6)}
                                      </td>
                                      <td className="pr-4 py-0.5">
                                        {currency.format(execution.proceeds)}
                                      </td>
                                      <td
                                        className={`py-0.5 ${
                                          execution.profit >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {formatSignedCurrency(execution.profit)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, trades.length)} of{" "}
                {trades.length}
              </span>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage((prev) => Math.max(1, prev - 1));
                      }}
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationLink href="#" isActive size="default">
                      Page {currentPage} / {totalPages}
                    </PaginationLink>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage((prev) =>
                          Math.min(totalPages, prev + 1),
                        );
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
