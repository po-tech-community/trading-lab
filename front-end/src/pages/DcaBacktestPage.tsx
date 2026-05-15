import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { runBacktest, type RunBacktestResponse, type RunBacktestRequestBody} from "@/lib/backtest-api";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Minimize2, Maximize2, Zap } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

import { StrategyConfigCard, type StrategyConfigCardHandle } from "./dca-backtest/StrategyConfigCard";
import { SummaryStatsCards } from "./dca-backtest/SummaryStatsCards";
import { PortfolioTrajectoryChart } from "./dca-backtest/PortfolioTrajectoryChart";
import { timelineToChartData } from "./dca-backtest/timeline-to-chart";
import { TradeHistoryTable } from "./dca-backtest/TradeHistoryTable";

// L4-FE-1/2/3 — AI Advisor panel + trigger button
import { AiAdvisorPanel, AiAdvisorTrigger } from "@/components/ai/AiAdvisorPanel";
import type { SuggestedAction } from "@/lib/ai-api";

function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const m = error.data?.message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
    return error.message;
  }
  return error instanceof Error ? error.message : "Request failed";
}

/**
 * DCA Backtest page: simulate recurring investments over historical data.
 */
export default function DcaBacktestPage() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [backtestResult, setBacktestResult] =
    useState<RunBacktestResponse | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<
    "BTC" | "ETH" | "AAPL" | "TSLA"
  >("BTC");

  const [lastConfig, setLastConfig] = useState<RunBacktestRequestBody | undefined>(undefined);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const strategyCardRef = useRef<StrategyConfigCardHandle>(null);
  
  useEffect(() => {
    if (!location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      setIsSidebarCollapsed(false);
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);


  const assetLabelMap: Record<typeof selectedSymbol, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    AAPL: "Apple",
    TSLA: "Tesla",
  };

  const mutation = useMutation({
    mutationFn: runBacktest,
    onSuccess: (data) => {
      setBacktestResult(data);
      toast.success("Backtest completed");
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const chartData = backtestResult
    ? timelineToChartData(backtestResult.timeline)
    : [];
  const chartDescription = backtestResult
    ? `Performance over the selected range (${chartData.length} points)`
    : "Run a backtest to see your equity curve";

  const handleSuggestedAction = (action: SuggestedAction) => {
    setAiPanelOpen(false);
    setIsSidebarCollapsed(false);
    strategyCardRef.current?.applyField(action.field as never, action.value as never);
    toast.success(`Applied: ${action.label}`, {
      description: "Form updated — review the change and re-run the backtest.",
      duration: 4000,
    });
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col gap-4 pb-10",
          isFullscreen
            ? "fixed inset-0 z-50 bg-background p-6 overflow-auto"
            : "",
        )}
      >
        <PageHeader
          label="Simulator engine v1.0"
          icon={Zap}
          title="DCA Backtest"
          description="Analyze the historical performance of recurring investments with our high-precision simulation engine."
          actions={
            <div className="flex items-center gap-2">
              {/* L4-FE-1: "Consult AI Advisor" trigger button */}
              <AiAdvisorTrigger
                onClick={() => setAiPanelOpen(true)}
                hasResult={!!backtestResult}
              />
 
              {isFullscreen ? (
                <Button variant="outline" onClick={() => setIsFullscreen(false)}>
                  <Minimize2 className="mr-2 h-4 w-4" />
                  Exit fullscreen
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsFullscreen(true)}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Fullscreen
                </Button>
              )}
            </div>
          }
        />

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <StrategyConfigCard
            ref={strategyCardRef}
            onSubmit={(body) => {
              setLastConfig(body);
              mutation.mutate(body);
            }}
            onSymbolChange={setSelectedSymbol}
            isSubmitting={mutation.isPending}
            submitError={
              mutation.isError ? formatApiError(mutation.error) : null
            }
            isCollapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
          />

          <div className="flex-1 flex flex-col gap-4 w-full overflow-hidden">
            <SummaryStatsCards summary={backtestResult?.summary ?? null} />

            {chartData.length > 0 ? (
              <>
                <PortfolioTrajectoryChart
                  data={chartData}
                  trades={backtestResult?.trades ?? []}
                  isFullscreen={isFullscreen}
                  onFullscreenChange={() => setIsFullscreen(!isFullscreen)}
                  chartDescription={chartDescription}
                  assetLabel={assetLabelMap[selectedSymbol]}
                />
                <TradeHistoryTable trades={backtestResult?.trades ?? []} />
              </>
            ) : (
              <Card
                className={cn(
                  "flex-1 bg-card relative overflow-hidden border",
                  isFullscreen && "min-h-[500px]",
                )}
              >
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-semibold">
                    Portfolio trajectory
                  </CardTitle>
                  <CardDescription>{chartDescription}</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[420px] items-center justify-center text-muted-foreground text-sm">
                  Configure your strategy and choose &quot;Calculate
                  returns&quot; to load historical performance.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <AiAdvisorPanel
          open={aiPanelOpen}
          onOpenChange={setAiPanelOpen}
          summary={backtestResult?.summary ?? null}
          trades={backtestResult?.trades}
          config={lastConfig ? {
            symbol: lastConfig.symbol,
            amount: lastConfig.amount,
            frequency: lastConfig.frequency,
            startDate: lastConfig.startDate,
            endDate: lastConfig.endDate,
          } : undefined}
          onSuggestedAction={handleSuggestedAction}
        />
    </TooltipProvider>
  );
}
