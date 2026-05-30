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

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/common/PageHeader";
import { AiAdvisorPanel, AiAdvisorTrigger } from "@/components/ai/AiAdvisorPanel";
import type { SuggestedAction } from "@/lib/ai-api";
import { saveBacktestHistory } from "@/lib/backtest-history-api";
import { useChatContext } from "@/providers/ChatProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PortfolioConfigCard, type PortfolioConfigCardHandle } from "@/pages/portfolio-backtest/PortfolioConfigCard";
import type { PortfolioFormValues } from "@/pages/portfolio-backtest/portfolio-form-schema";
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

const ASSET_LABELS: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  AAPL: "Apple",
  TSLA: "Tesla",
};

export default function PortfolioPage() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<RunPortfolioBacktestResponse | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const portfolioCardRef = useRef<PortfolioConfigCardHandle>(null);


  const { setLatestBacktest } = useChatContext();

  const mutation = useMutation({
    mutationFn: runPortfolioBacktest,
    onSuccess: (data, variables) => {
      setResult(data);
      toast.success("Portfolio backtest completed");
      const symbols = data.summary.assets.map((a) => a.symbol).join(" / ");
      const label = `${symbols} portfolio backtest`;
      const flatSummary = {
        totalInvested: data.summary.totalInvested,
        currentValue: data.summary.currentValue,
        totalReturnPercentage: data.summary.totalReturnPercentage,
        totalHoldings: data.summary.assets.reduce((s, a) => s + a.totalUnits, 0),
        numberOfPurchases: data.summary.numberOfPurchases,
        realizedProfit: data.summary.realizedProfit,
        unrealizedValue: data.summary.unrealizedValue,
      };
      setLatestBacktest({
        summary: flatSummary,
        trades: data.trades,
        mode: "portfolio",
        label,
        assets: variables.assets,
      });
      saveBacktestHistory({
        mode: "portfolio",
        label,
        summary: flatSummary,
        trades: data.trades,
        config: { assets: variables.assets },
      }).catch(() => {});
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

  function handleSuggestedAction(action: SuggestedAction) {
    setAiPanelOpen(false);
    setIsCollapsed(false);
    // "amount" in SuggestedAction maps to "totalAmount" in portfolio form
    const field = (action.field === "amount" ? "totalAmount" : action.field) as keyof PortfolioFormValues;
    portfolioCardRef.current?.applyField(field, action.value as never);
    toast.success(`Applied: ${action.label}`, {
      description: "Form updated — review the change and re-run the backtest.",
      duration: 4000,
    });
  }

  const chartData = result ? timelineToChartData(result.timeline) : [];

  useEffect(() => {
    if (!location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      setIsCollapsed(false);
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  const assetSeriesOptions = useMemo(() => {
    if (!result) return [];

    const pointsBySymbol = new Map<
      string,
      { date: string; invested: number; value: number; close: number }[]
    >();

    for (const point of result.timeline) {
      const date = new Date(point.date).toISOString().slice(0, 10);
      for (const slice of point.assets) {
        const existing = pointsBySymbol.get(slice.symbol) ?? [];
        existing.push({
          date,
          invested: slice.invested,
          value: slice.value,
          close: slice.close,
        });
        pointsBySymbol.set(slice.symbol, existing);
      }
    }

    return result.summary.assets
      .map((asset) => ({
        symbol: asset.symbol,
        label: ASSET_LABELS[asset.symbol] ?? asset.symbol,
        data: pointsBySymbol.get(asset.symbol) ?? [],
      }))
      .filter((option) => option.data.length > 0);
  }, [result]);

  return (
    <TooltipProvider>
    <div
      className={cn(
        "space-y-6",
        isFullscreen
          ? "fixed inset-0 z-50 bg-background p-6 overflow-auto"
          : "",
      )}
    >
      <PageHeader
        title="Portfolio Backtest"
        description="Build a multi-asset DCA portfolio and simulate its historical performance."
        actions={
          <div className="flex items-center gap-2">
            <AiAdvisorTrigger
              onClick={() => setAiPanelOpen(true)}
              hasResult={!!result}
            />
            {isFullscreen ? (
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
                <Minimize2 className="mr-2 h-4 w-4" />
                Exit fullscreen
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Fullscreen
              </Button>
            )}
          </div>
        }
      />

      {/* ── Main layout: sidebar + content ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: Portfolio config with AssetList (L2-FE-1) ── */}
        <PortfolioConfigCard
          ref={portfolioCardRef}
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
                    realizedProfit: result.summary.realizedProfit,
                    unrealizedValue: result.summary.unrealizedValue,
                  }
                : null
            }
          />

          <div id="allocation-overview" className="grid gap-4 md:grid-cols-2 scroll-mt-6">
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
                assetSeriesOptions={assetSeriesOptions}
              />
              <TradeHistoryTable
                trades={result?.trades ?? []}
                mode="portfolio"
                portfolioSymbols={
                  result?.summary.assets.map((a) => a.symbol) ?? []
                }
              />
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

      <AiAdvisorPanel
        open={aiPanelOpen}
        onOpenChange={setAiPanelOpen}
        mode="portfolio"
        onSuggestedAction={handleSuggestedAction}
        summary={
          result
            ? {
                totalInvested: result.summary.totalInvested,
                currentValue: result.summary.currentValue,
                totalReturnPercentage: result.summary.totalReturnPercentage,
                totalHoldings: result.summary.assets.reduce((s, a) => s + a.totalUnits, 0),
                numberOfPurchases: result.summary.numberOfPurchases,
                realizedProfit: result.summary.realizedProfit,
                unrealizedValue: result.summary.unrealizedValue,
              }
            : null
        }
        assets={result?.summary.assets.map((a) => ({ symbol: a.symbol, weight: a.weight })) ?? []}
        trades={result?.trades}
      />
    </div>
    </TooltipProvider>
  );
}