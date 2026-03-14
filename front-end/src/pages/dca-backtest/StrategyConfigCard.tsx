import { Settings2, ChevronLeft, ChevronRight, DollarSign, HelpCircle, Target } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export interface StrategyConfigCardProps {
  /** Selected asset (e.g. BTC, ETH) */
  asset: string
  onAssetChange: (value: string) => void
  /** Investment amount per period (USD string) */
  amount: string
  onAmountChange: (value: string) => void
  /** Frequency: daily, weekly, bi-weekly, monthly */
  frequency: string
  onFrequencyChange: (value: string) => void
  onCalculate: () => void
  /** When true, sidebar shows only expand button */
  isCollapsed: boolean
  onCollapsedChange: (value: boolean) => void
}

/**
 * Left sidebar card: strategy parameters (asset, amount, frequency, date range).
 * Collapsible on small screens to give more space to the chart.
 */
export function StrategyConfigCard({
  asset,
  onAssetChange,
  amount,
  onAmountChange,
  frequency,
  onFrequencyChange,
  onCalculate,
  isCollapsed,
  onCollapsedChange,
}: StrategyConfigCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden shrink-0 py-6",
        isCollapsed ? "w-16 h-12 overflow-hidden" : "w-full lg:col-span-4 lg:w-[360px]"
      )}
    >
      {/* Decorative background icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Target className="h-20 w-20 rotate-12" />
      </div>

      <div className="flex flex-col h-full gap-4">
        {/* Header: title + collapse button */}
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

        {/* Collapsed state: show only expand button */}
        {isCollapsed && (
          <div className="flex items-center justify-center h-full w-full">
            <Button variant="ghost" size="icon" onClick={() => onCollapsedChange(false)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {/* Form fields */}
        <CardContent className={cn("space-y-4 relative pt-0", isCollapsed && "hidden")}>
          {/* Asset selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="asset" className="text-xs text-muted-foreground">
                Select asset
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  The cryptocurrency or stock you want to simulate buying periodically.
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={asset} onValueChange={onAssetChange}>
              <SelectTrigger
                id="asset"
                className="h-10 bg-background/30 border-primary/10 hover:border-primary/30 transition-colors rounded-md font-medium"
              >
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
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
          </div>

          {/* Investment amount */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="amount" className="text-xs text-muted-foreground">
                Investment amount
              </Label>
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
              <Input
                id="amount"
                type="number"
                className="pl-10 h-10 font-medium"
                placeholder="100"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                USD
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="frequency" className="text-xs text-muted-foreground">
                Repeat frequency
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  How often you want to make a purchase. More frequent buying reduces timing risk.
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={frequency} onValueChange={onFrequencyChange}>
              <SelectTrigger
                id="frequency"
                className="h-10 bg-background/30 border-primary/10 hover:border-primary/30 transition-colors rounded-md font-medium"
              >
                <SelectValue placeholder="Select Frequency" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-primary/10">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="start-date"
                type="date"
                defaultValue="2023-01-01"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="end-date"
                type="date"
                defaultValue="2023-12-31"
                className="h-10 text-sm"
              />
            </div>
          </div>

          <Button onClick={onCalculate} className="w-full" variant="default">
            Calculate returns
          </Button>
        </CardContent>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-border" />
    </Card>
  )
}
