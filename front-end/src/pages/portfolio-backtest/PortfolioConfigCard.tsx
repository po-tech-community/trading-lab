/**
 * L2-FE-1 — Portfolio strategy configuration card.
 *
 * Sidebar card with:
 *  - AssetList component (dynamic rows: symbol + weight)
 *  - Amount, frequency, date range
 *  - Submit blocked until weights sum to 100%
 */

import { forwardRef, useImperativeHandle } from "react";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  HelpCircle,
  Settings2,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { TriggerConfigSection } from "@/pages/dca-backtest/TriggerConfigSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  portfolioFormSchema,
  portfolioFormValuesToRequest,
  type PortfolioFormValues,
} from "./portfolio-form-schema";
import type { RunPortfolioBacktestRequestBody } from "@/lib/backtest-api";
import { AssetList } from "@/components/portfolio/AssetList";
import { Separator } from "@/components/ui/separator";
import {
  getCryptoMinUtcIsoDate,
  getTodayUtcIsoDate,
} from "@/pages/dca-backtest/backtest-form-schema";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PortfolioConfigCardHandle {
  applyField: <K extends keyof PortfolioFormValues>(
    field: K,
    value: PortfolioFormValues[K],
  ) => void;
}

export interface PortfolioConfigCardProps {
  onSubmit: (body: RunPortfolioBacktestRequestBody) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  isCollapsed: boolean;
  onCollapsedChange: (value: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PortfolioConfigCard = forwardRef<
  PortfolioConfigCardHandle,
  PortfolioConfigCardProps
>(function PortfolioConfigCard({
  onSubmit,
  isSubmitting = false,
  submitError,
  isCollapsed,
  onCollapsedChange,
}, ref) {
  const todayIso = getTodayUtcIsoDate();
  const oneYearAgoIso = getCryptoMinUtcIsoDate();
  const defaultStart = oneYearAgoIso > "" ? oneYearAgoIso : "2023-01-01";
  const defaultEnd = todayIso;

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema) as any,
    defaultValues: {
      assets: [
        { symbol: "BTC", weight: 60 },
        { symbol: "ETH", weight: 40 },
      ],
      totalAmount: 200,
      frequency: "weekly",
      startDate: defaultStart,
      endDate: defaultEnd,
      takeProfitEnabled: false,
      takeProfitThreshold: 20,
      takeProfitSellPercent: 100,
      stopLossEnabled: false,
      stopLossThreshold: 10,
      stopLossSellPercent: 100,
    },
    mode: "onChange",
  });

  useImperativeHandle(ref, () => ({
    applyField: (field, value) => form.setValue(field, value as never, { shouldValidate: true }),
  }));

  // Derive whether weight sum is currently valid (live, from watched values)
  const assets = form.watch("assets");
  const weightSum = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0);
  const isWeightSumValid = weightSum === 100;

  const takeProfitEnabled = form.watch("takeProfitEnabled");
  const stopLossEnabled = form.watch("stopLossEnabled");

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(portfolioFormValuesToRequest(values));
  });

  return (
    <Card
      id="portfolio-config"
      className={cn(
        "relative overflow-hidden shrink-0 py-6 scroll-mt-6",
        isCollapsed
          ? "w-16 h-12 overflow-hidden"
          : "w-full lg:col-span-4 lg:w-[380px]",
      )}
    >
      {/* Decorative background icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Target className="h-20 w-20 rotate-12" />
      </div>

      <div className="flex flex-col h-full gap-4">
        {/* ── Header ── */}
        <CardHeader className={cn("relative", isCollapsed && "hidden")}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Settings2 className="size-5" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCollapsedChange(true)}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
          <CardTitle className="text-xl font-bold">Portfolio Config</CardTitle>
          <CardDescription>Tailor your parameters</CardDescription>
        </CardHeader>

        {/* ── Collapsed state ── */}
        {isCollapsed && (
          <div className="flex items-center justify-center h-full w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCollapsedChange(false)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {/* ── Form body ── */}
        <CardContent
          className={cn("space-y-4 relative pt-0", isCollapsed && "hidden")}
        >
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <fieldset disabled={isSubmitting} className="space-y-2">
                {/* ── Asset list (L2-FE-1) ── */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Assets &amp; Weights
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[240px]">
                        Add portfolio assets and set weights so the total
                        allocation equals exactly 100%.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <AssetList fieldArrayName="assets" />
                </div>

                <Separator />

                {/* ── Investment amount ── */}
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-xs text-muted-foreground">
                          Investment amount
                        </FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[200px]"
                          >
                            The fixed amount of USD you will invest in each
                            period (e.g. $200 every week).
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <DollarSign className="size-3.5" />
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            className="pl-10 h-10 font-medium"
                            placeholder="200"
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={
                              Number.isFinite(field.value) ? field.value : ""
                            }
                            onChange={(e) => {
                              const n = e.target.valueAsNumber;
                              field.onChange(Number.isNaN(n) ? 0 : n);
                            }}
                          />
                        </FormControl>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          USD
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ── Frequency ── */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-xs text-muted-foreground">
                          Repeat frequency
                        </FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[200px]"
                          >
                            How often you want to make a purchase. More frequent
                            buying reduces timing risk.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-background/30 border-primary/10 hover:border-primary/30 transition-colors rounded-md font-medium">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-primary/10">
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ── Date range ── */}
                <div className="grid grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-1.5 space-y-0">
                        <FormLabel className="text-xs text-muted-foreground">
                          From
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-10 text-sm"
                            max={todayIso}
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs leading-snug">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-1.5 space-y-0">
                        <FormLabel className="text-xs text-muted-foreground">
                          To
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-10 text-sm"
                            max={todayIso}
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs leading-snug">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <p className="text-xs text-amber-600" role="note">
                  Default range is set to From = 1 year ago and To = today. You
                  can change it, but the selected range must stay within 365
                  days.
                </p>

                {/* ── API submit error ── */}
                {submitError && (
                  <p className="text-sm text-destructive" role="alert">
                    {submitError}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Smart triggers (optional)
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[240px]">
                        Enable take profit and/or stop loss to simulate
                        automatic sell actions. Matching trades will appear in
                        Trade History after running the backtest.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <TriggerConfigSection
                    control={form.control}
                    enabledName="takeProfitEnabled"
                    enabled={takeProfitEnabled}
                    title="Take profit"
                    icon={
                      <TrendingUp className="size-4 text-emerald-600 shrink-0" />
                    }
                    thresholdName="takeProfitThreshold"
                    thresholdLabel="Threshold (% gain)"
                    thresholdMax={1000}
                    sellPercentName="takeProfitSellPercent"
                  />
                  <TriggerConfigSection
                    control={form.control}
                    enabledName="stopLossEnabled"
                    enabled={stopLossEnabled}
                    title="Stop loss"
                    icon={
                      <TrendingDown className="size-4 text-rose-600 shrink-0" />
                    }
                    thresholdName="stopLossThreshold"
                    thresholdLabel="Threshold (% drawdown)"
                    thresholdMax={100}
                    sellPercentName="stopLossSellPercent"
                  />
                </div>

                {/* ── Submit ── */}
                {/*
                  HIGHLIGHTED CHANGE (L2-FE-1):
                  Button is disabled when:
                    1. Form is submitting (isSubmitting)
                    2. Weight sum ≠ 100% (!isWeightSumValid)
                  The weight validation tooltip text gives a clear reason.
                */}
                <Button
                  type="submit"
                  className="w-full"
                  variant="default"
                  disabled={isSubmitting || !isWeightSumValid}
                  title={
                    !isWeightSumValid
                      ? `Weights must sum to 100% (currently ${weightSum}%)`
                      : undefined
                  }
                >
                  {isSubmitting ? "Calculating…" : "Run portfolio backtest"}
                </Button>

                {/* Helpful hint under button when weights are invalid */}
                {!isWeightSumValid && !isSubmitting && (
                  <p className="text-xs text-center text-muted-foreground -mt-2">
                    Adjust weights above to enable submit
                  </p>
                )}
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-border" />
    </Card>
  );
});
