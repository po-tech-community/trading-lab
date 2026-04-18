/**
 * Portfolio Backtest Page
 *
 * Integrates the L2-FE-1 AssetList component via PortfolioConfigCard.
 * Users can build a multi-asset portfolio, validate that weights sum to 100%,
 * and submit a backtest run.
 *
 * HIGHLIGHTED CHANGES (L2-FE-1):
 *  - Replaced static mock layout with PortfolioConfigCard + AssetList
 *  - Added collapsible sidebar (mirrors DcaBacktestPage pattern)
 *  - Added submit handler wired to runPortfolioBacktest API
 *  - Retains mock summary cards as placeholders until L2-FE-3 is done
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PortfolioConfigCard } from "@/pages/portfolio-backtest/PortfolioConfigCard";
import { runPortfolioBacktest } from "@/lib/backtest-api";
import type {
  RunPortfolioBacktestRequestBody,
  RunPortfolioBacktestResponse,
} from "@/lib/backtest-api";
import { timelineToChartData } from "@/pages/dca-backtest/timeline-to-chart";
import CompositionPieChart from "@/pages/portfolio-backtest/CompositionPieChart";
import AssetBreakdown from "@/pages/portfolio-backtest/AssetBreakdown";
import { SummaryStatsCards } from "@/pages/dca-backtest/SummaryStatsCards";
import { PortfolioTrajectoryChart } from "@/pages/dca-backtest/PortfolioTrajectoryChart";
import { TradeHistoryTable } from "@/pages/dca-backtest/TradeHistoryTable";

export default function PortfolioPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<RunPortfolioBacktestResponse | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: runPortfolioBacktest,
    onSuccess: (data) => {
      setResult(data);
      toast.success("Portfolio backtest completed");
    },
    onError: (err) => {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    },
  });

  function handleSubmit(body: RunPortfolioBacktestRequestBody) {
    setSubmitError(null);
    mutation.mutate(body);
  }

  const chartData = result ? timelineToChartData(result.timeline) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Backtest"
        description="Build a multi-asset DCA portfolio and simulate its historical performance."
      />

      {/* ── Main layout: sidebar + content ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: Portfolio config with AssetList (L2-FE-1) ── */}
        <PortfolioConfigCard
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          submitError={submitError}
          isCollapsed={isCollapsed}
          onCollapsedChange={setIsCollapsed}
        />

        {/* ── Right: Results */}
        <div className="flex-1 space-y-4 min-w-0">
          <SummaryStatsCards
            summary={
              result
                ? {
                    totalInvested: result.summary.totalInvested,
                    currentValue: result.summary.currentValue,
                    totalReturnPercentage: result.summary.totalReturnPercentage,
                    totalHoldings: result.summary.assets.reduce(
                      (s, a) => s + a.totalUnits,
                      0,
                    ),
                    numberOfPurchases: result.summary.numberOfPurchases,
                    realizedProfit: 0, // TODO: implement for portfolio
                    unrealizedValue: result.summary.currentValue, // TODO: implement for portfolio
                  }
                : null
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CompositionPieChart
              assets={
                result
                  ? result.summary.assets.map((a) => ({
                      symbol: a.symbol,
                      weight: a.weight,
                    }))
                  : [{ symbol: "—", weight: 100 }]
              }
            />
            <AssetBreakdown
              items={
                result
                  ? result.summary.assets.map((a) => ({
                      symbol: a.symbol,
                      weight: a.weight,
                      invested: a.invested,
                      currentValue: a.currentValue,
                      returnPercentage: a.returnPercentage,
                    }))
                  : []
              }
            />
          </div>

          {chartData.length > 0 ? (
            <>
              <PortfolioTrajectoryChart
                data={chartData}
                isFullscreen={false}
                trades={result?.trades ?? []}
                onFullscreenChange={() => {}}
                chartDescription={`Portfolio performance (${chartData.length} points)`}
                assetLabel="Portfolio"
              />
              <TradeHistoryTable trades={result?.trades ?? []} />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Portfolio trajectory
                </CardTitle>
                <CardDescription>
                  Chart will render here after running a backtest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 rounded-md border border-dashed text-muted-foreground text-sm">
                  Configure assets on the left and click “Run portfolio
                  backtest”
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
