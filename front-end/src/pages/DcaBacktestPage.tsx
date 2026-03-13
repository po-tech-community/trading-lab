import { useState } from "react"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  DollarSign, 
  Target, 
  Zap, 
  Minimize2, 
  Maximize2,
  ChevronRight,
  HelpCircle,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_DATA = [
  { date: "2023-01-01", invested: 100, value: 100 },
  { date: "2023-02-01", invested: 200, value: 195 },
  { date: "2023-03-01", invested: 300, value: 340 },
  { date: "2023-04-01", invested: 400, value: 480 },
  { date: "2023-05-01", invested: 500, value: 460 },
  { date: "2023-06-01", invested: 600, value: 750 },
  { date: "2023-07-01", invested: 700, value: 920 },
  { date: "2023-08-01", invested: 800, value: 1050 },
  { date: "2023-09-01", invested: 900, value: 980 },
  { date: "2023-10-01", invested: 1000, value: 1250 },
  { date: "2023-11-01", invested: 1100, value: 1600 },
  { date: "2023-12-01", invested: 1200, value: 2150 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedDate = new Date(label).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })
    return (
      <div className="bg-background border p-3 rounded-md shadow-sm">
        <p className="text-xs text-muted-foreground mb-2">{formattedDate}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <span className="text-sm flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary" />
              Portfolio value
            </span>
            <span className="text-sm font-semibold text-primary">
              ${payload[0].value.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-sm flex items-center gap-2 text-muted-foreground">
              <div className="size-2 rounded-full bg-muted-foreground/40" />
              Total invested
            </span>
            <span className="text-sm">
              ${payload[1].value.toLocaleString()}
            </span>
          </div>
          <div className="pt-1.5 mt-1.5 border-t border-border flex items-center justify-between">
            <span className="text-xs text-emerald-500">Unrealized profit</span>
            <span className="text-xs font-semibold text-emerald-500">
              +${(payload[0].value - payload[1].value).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null;
};

export default function DcaBacktestPage() {
  const [asset, setAsset] = useState("BTC")
  const [amount, setAmount] = useState("100")
  const [frequency, setFrequency] = useState("weekly")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleCalculate = () => {
    console.log(`Calculating returns for ${asset} at ${amount}/per ${frequency}`);
    // Simulate calculation delay
  }
  
  return (
    <TooltipProvider>
      <div className={cn(
        "flex flex-col gap-8 pb-10",
        isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""
      )}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-sm">
              <Zap className="size-4" />
              Simulator engine v1.0
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              DCA Backtest
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Analyze the historical performance of recurring investments with our high-precision simulation engine.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isFullscreen ? (
              <Button 
                variant="outline" 
                onClick={() => setIsFullscreen(false)} 
              >
                <Minimize2 className="mr-2 h-4 w-4" />
                Exit fullscreen
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                Fullscreen
              </Button>
            )}
          </div>
        </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Input form */}
          <Card className={cn(
            "relative overflow-hidden shrink-0",
            isSidebarCollapsed ? "w-16 h-12 overflow-hidden" : "w-full lg:col-span-4 lg:w-[360px]"
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Target className="h-20 w-20 rotate-12" />
            </div>
            
            <div className="flex flex-col h-full">
              <CardHeader className={cn("relative p-4", isSidebarCollapsed && "hidden")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Settings2 className="size-5" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSidebarCollapsed(true)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl font-bold">Strategy Config</CardTitle>
                <CardDescription>Tailor your parameters</CardDescription>
              </CardHeader>

              {isSidebarCollapsed && (
                <div className="flex items-center justify-center h-full w-full">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSidebarCollapsed(false)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            
              <CardContent className={cn("space-y-6 relative p-4 pt-0", isSidebarCollapsed && "hidden")}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="asset" className="text-xs text-muted-foreground">Select asset</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        The cryptocurrency or stock you want to simulate buying periodically.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select defaultValue="BTC" onValueChange={setAsset}>
                    <SelectTrigger id="asset" className="h-10 bg-background/30 border-primary/10 hover:border-primary/30 transition-colors rounded-md font-medium">
                      <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/10">
                      <SelectItem value="BTC" className="focus:bg-primary/10 focus:text-primary">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH" className="focus:bg-primary/10 focus:text-primary">Ethereum (ETH)</SelectItem>
                      <SelectItem value="AAPL" className="focus:bg-primary/10 focus:text-primary">Apple (AAPL)</SelectItem>
                      <SelectItem value="TSLA" className="focus:bg-primary/10 focus:text-primary">Tesla (TSLA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amount" className="text-xs text-muted-foreground">Investment amount</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        The fixed amount of USD you will invest in each period (e.g. $100 every week).
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <DollarSign className="size-3.5" />
                    </div>
                    <Input 
                      id="amount" 
                      type="number" 
                      className="pl-10 h-10 font-medium" 
                      placeholder="100" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="frequency" className="text-xs text-muted-foreground">Repeat frequency</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        How often you want to make a purchase. More frequent buying reduces timing risk.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select defaultValue="weekly" onValueChange={setFrequency}>
                    <SelectTrigger id="frequency" className="h-10 bg-background/30 border-primary/10 hover:border-primary/30 transition-colors rounded-md font-medium">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                    <Input id="start-date" type="date" defaultValue="2023-01-01" className="h-10 text-sm" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                    <Input id="end-date" type="date" defaultValue="2023-12-31" className="h-10 text-sm" />
                  </div>
                </div>

                <Button 
                  onClick={handleCalculate}
                  className="w-full"
                  variant="default"
                >
                  Calculate returns
                </Button>
              </CardContent>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-px bg-border" />
          </Card>

          {/* Results Section */}
          <div className="flex-1 flex flex-col gap-8 w-full overflow-hidden">
            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden border bg-card/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Wallet className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">
                        Total invested
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Contributions over the selected period
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-semibold tabular-nums">$1,200.00</div>
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-primary/30" />
                    12 installments
                  </div>
                  <div className="absolute -bottom-6 -right-6 p-6 opacity-10">
                    <DollarSign className="size-24" />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border bg-card/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
                      <TrendingUp className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">
                        Portfolio value
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Current value of recurring buys
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-semibold tabular-nums text-emerald-500">$2,150.42</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-1 border border-emerald-500/20">
                      <ArrowUpRight className="h-3 w-3" />
                      +79.2%
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 p-6 opacity-10 text-emerald-500">
                    <TrendingUp className="size-24" />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border bg-card/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-md bg-orange-500/10 text-orange-500">
                      <ArrowUpRight className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">
                        ROI
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Total profit from this strategy
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-semibold tabular-nums text-orange-500">+$950.42</div>
                  <div className="text-xs text-muted-foreground mt-2">Total profit generated</div>
                  <div className="absolute -bottom-6 -right-6 p-6 opacity-10 text-orange-500">
                    <Zap className="size-24" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Strategy presets (mock)</CardTitle>
                <CardDescription>
                  Quickly try a few common DCA configurations. These buttons do not change inputs yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 text-sm">
                <Button variant="outline" size="sm">
                  BTC · $100 weekly · 1 year
                </Button>
                <Button variant="outline" size="sm">
                  ETH · $50 weekly · 2 years
                </Button>
                <Button variant="outline" size="sm">
                  AAPL · $200 monthly · 3 years
                </Button>
                <Button variant="outline" size="sm">
                  TSLA · $100 bi-weekly · 18 months
                </Button>
              </CardContent>
            </Card>

            {/* Main chart */}
            <Card className={cn(
              "flex-1 bg-card relative overflow-hidden",
              isFullscreen && "min-h-[500px]"
            )}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50 mx-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Portfolio trajectory</CardTitle>
                  <CardDescription>Performance visualization (Jan - Dec 2023)</CardDescription>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-6 mr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">Equity</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-2 w-2 rounded-md bg-muted-foreground/20" />
                      <span className="text-xs text-muted-foreground">Basis</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="size-4" />
                    ) : (
                      <Maximize2 className="size-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className={cn("w-full p-8", isFullscreen ? "h-[calc(100vh-250px)]" : "h-[420px]")}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValueEnh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                      tickFormatter={(str) => {
                        try {
                          return new Date(str).toLocaleDateString("en-US", { month: "short" });
                        } catch (e) {
                          return str;
                        }
                      }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                      tickFormatter={(value) => `$${value}`}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorValueEnh)" 
                      animationDuration={800}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 3 }}
                    />
                    <Area 
                      type="stepAfter" 
                      dataKey="invested" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2} 
                      fill="transparent"
                      strokeDasharray="6 6"
                      opacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function Settings2(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  )
}
