import { zodResolver } from "@hookform/resolvers/zod"
import { Settings2, ChevronLeft, ChevronRight, DollarSign, HelpCircle, Target } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import {
  backtestFormSchema,
  type BacktestFormValues,
  backtestFormValuesToRequest,
} from "./backtest-form-schema"
import type { RunBacktestRequestBody } from "@/lib/backtest-api"

export interface StrategyConfigCardProps {
  /** Called with validated payload (epoch ms dates). */
  onSubmit: (body: RunBacktestRequestBody) => void
  isSubmitting?: boolean
  submitError?: string | null
  isCollapsed: boolean
  onCollapsedChange: (value: boolean) => void
}

/**
 * Left sidebar card: strategy parameters (asset, amount, frequency, date range).
 * Collapsible on small screens to give more space to the chart.
 */
export function StrategyConfigCard({
  onSubmit,
  isSubmitting = false,
  submitError,
  isCollapsed,
  onCollapsedChange,
}: StrategyConfigCardProps) {
  const form = useForm<BacktestFormValues>({
    resolver: zodResolver(backtestFormSchema),
    defaultValues: {
      symbol: "BTC",
      amount: 100,
      frequency: "weekly",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
    },
  })

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(backtestFormValuesToRequest(values))
  })

  return (
    <Card
      className={cn(
        "relative overflow-hidden shrink-0 py-6",
        isCollapsed ? "w-16 h-12 overflow-hidden" : "w-full lg:col-span-4 lg:w-[360px]"
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Target className="h-20 w-20 rotate-12" />
      </div>

      <div className="flex flex-col h-full gap-4">
        <CardHeader className={cn("relative", isCollapsed && "hidden")}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Settings2 className="size-5" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => onCollapsedChange(true)}>
              <ChevronLeft className="size-4" />
            </Button>
          </div>
          <CardTitle className="text-xl font-bold">Strategy Config</CardTitle>
          <CardDescription>Tailor your parameters</CardDescription>
        </CardHeader>

        {isCollapsed && (
          <div className="flex items-center justify-center h-full w-full">
            <Button variant="ghost" size="icon" onClick={() => onCollapsedChange(false)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        <CardContent className={cn("space-y-4 relative pt-0", isCollapsed && "hidden")}>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset disabled={isSubmitting} className="space-y-4">
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-xs text-muted-foreground">Select asset</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            The cryptocurrency or stock you want to simulate buying periodically.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-background/30 border-primary/10 hover:border-primary/30 transition-colors rounded-md font-medium">
                            <SelectValue placeholder="Select asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-primary/10">
                          <SelectItem value="BTC" className="focus:bg-primary/10 focus:text-primary">
                            Bitcoin (BTC)
                          </SelectItem>
                          <SelectItem value="ETH" className="focus:bg-primary/10 focus:text-primary">
                            Ethereum (ETH)
                          </SelectItem>
                          <SelectItem value="AAPL" className="focus:bg-primary/10 focus:text-primary">
                            Apple (AAPL)
                          </SelectItem>
                          <SelectItem value="TSLA" className="focus:bg-primary/10 focus:text-primary">
                            Tesla (TSLA)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-xs text-muted-foreground">Investment amount</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            The fixed amount of USD you will invest in each period (e.g. $100 every week).
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
                            placeholder="100"
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

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-xs text-muted-foreground">Repeat frequency</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            How often you want to make a purchase. More frequent buying reduces timing risk.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-xs text-muted-foreground">From</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-10 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-xs text-muted-foreground">To</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-10 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {submitError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {submitError}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" variant="default" loading={isSubmitting}>
                  Calculate returns
                </Button>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-border" />
    </Card>
  )
}
