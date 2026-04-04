/**
 * L2-FE-1 — Portfolio strategy configuration card.
 *
 * Sidebar card with:
 *  - AssetList component (dynamic rows: symbol + weight)
 *  - Amount, frequency, date range
 *  - Submit blocked until weights sum to 100%
 */
 
import { ChevronLeft, ChevronRight, DollarSign, Settings2, Target } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  portfolioFormSchema,
  portfolioFormValuesToRequest,
  type PortfolioFormValues,
} from "./portfolio-form-schema"
import type { RunPortfolioBacktestRequestBody } from "@/lib/backtest-api"
import { AssetList } from "@/components/portfolio/AssetList"
import { Separator } from "@/components/ui/separator"
 
// ── Props ─────────────────────────────────────────────────────────────────────
 
export interface PortfolioConfigCardProps {
  onSubmit: (body: RunPortfolioBacktestRequestBody) => void
  isSubmitting?: boolean
  submitError?: string | null
  isCollapsed: boolean
  onCollapsedChange: (value: boolean) => void
}
 
// ── Component ─────────────────────────────────────────────────────────────────
 
export function PortfolioConfigCard({
  onSubmit,
  isSubmitting = false,
  submitError,
  isCollapsed,
  onCollapsedChange,
}: PortfolioConfigCardProps) {
  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema) as any,
    defaultValues: {
      assets: [
        { symbol: "BTC", weight: 60 },
        { symbol: "ETH", weight: 40 },
      ],
      totalAmount: 200,
      frequency: "weekly",
      startDate: "2025-05-01",
      endDate: "2025-06-01",
    },
    mode: "onChange",
  })
 
  // Derive whether weight sum is currently valid (live, from watched values)
  const assets = form.watch("assets")
  const weightSum = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0)
  const isWeightSumValid = weightSum === 100
 
  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(portfolioFormValuesToRequest(values))
  })
 
  return (
    <Card
      className={cn(
        "relative overflow-hidden shrink-0 py-6",
        isCollapsed
          ? "w-16 h-12 overflow-hidden"
          : "w-full lg:col-span-4 lg:w-[380px]"
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
          <CardDescription>
            Add assets &amp; set weights that sum to 100%
          </CardDescription>
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
        <CardContent className={cn("space-y-5 relative pt-0", isCollapsed && "hidden")}>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <fieldset disabled={isSubmitting} className="space-y-5">
 
                {/* ── Asset list (L2-FE-1) ── */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Assets &amp; Weights
                  </p>
                  <AssetList fieldArrayName="assets" />
                </div>
 
                <Separator />
 
                {/* ── Investment amount ── */}
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs text-muted-foreground">
                        Investment amount per period
                      </FormLabel>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <DollarSign className="size-3.5" />
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            className="pl-10 h-9 font-medium"
                            placeholder="200"
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={Number.isFinite(field.value) ? field.value : ""}
                            onChange={(e) => {
                              const n = e.target.valueAsNumber
                              field.onChange(Number.isNaN(n) ? 0 : n)
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
                      <FormLabel className="text-xs text-muted-foreground">
                        Repeat frequency
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 font-medium">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs text-muted-foreground">
                          From
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className="h-9 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs text-muted-foreground">
                          To
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className="h-9 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
 
                {/* ── API submit error ── */}
                {submitError && (
                  <p className="text-sm text-destructive" role="alert">
                    {submitError}
                  </p>
                )}
 
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
  )
}
 