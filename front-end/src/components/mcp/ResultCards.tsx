import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, PieChart, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface MarketSnapshotData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
}

export interface RiskCheckData {
  overallRisk: 'low' | 'medium' | 'high';
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  var95: number;
  stressTestResult: string;
}

export interface AllocationDiagnosticsData {
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
  rebalanceNeeded: boolean;
  driftAmount: number;
  suggestedTrades: Array<{
    symbol: string;
    action: 'buy' | 'sell';
    shares: number;
    estimatedValue: number;
  }>;
}

interface MarketSnapshotCardProps {
  data: MarketSnapshotData;
  onViewDetails?: () => void;
  onAddToWatchlist?: () => void;
}

export function MarketSnapshotCard({ data, onViewDetails, onAddToWatchlist }: MarketSnapshotCardProps) {
  const isPositive = data.change >= 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{data.symbol}</CardTitle>
          <Badge variant={isPositive ? "default" : "destructive"}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-lg font-semibold">${data.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Change</p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}${data.change.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Volume</p>
            <p className="font-medium">{(data.volume / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p className="text-muted-foreground">P/E</p>
            <p className="font-medium">{data.peRatio.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Yield</p>
            <p className="font-medium">{data.dividendYield.toFixed(2)}%</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button size="sm" variant="outline" onClick={onViewDetails} className="flex-1">
              View Details
            </Button>
          )}
          {onAddToWatchlist && (
            <Button size="sm" onClick={onAddToWatchlist} className="flex-1">
              Add to Watchlist
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RiskCheckCardProps {
  data: RiskCheckData;
  onViewReport?: () => void;
  onAdjustStrategy?: () => void;
}

export function RiskCheckCard({ data, onViewReport, onAdjustStrategy }: RiskCheckCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
          <Badge className={getRiskColor(data.overallRisk)}>
            {data.overallRisk.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Volatility</p>
            <p className="text-lg font-semibold">{data.volatility.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
            <p className="text-lg font-semibold">{data.sharpeRatio.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Max Drawdown</span>
            <span className="font-medium">{data.maxDrawdown.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${Math.min(Math.abs(data.maxDrawdown), 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Beta</p>
            <p className="font-medium">{data.beta.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">VaR (95%)</p>
            <p className="font-medium">{data.var95.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <CheckCircle className="h-4 w-4 inline mr-1" />
            {data.stressTestResult}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          {onViewReport && (
            <Button size="sm" variant="outline" onClick={onViewReport} className="flex-1">
              View Full Report
            </Button>
          )}
          {onAdjustStrategy && (
            <Button size="sm" onClick={onAdjustStrategy} className="flex-1">
              Adjust Strategy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AllocationDiagnosticsCardProps {
  data: AllocationDiagnosticsData;
  onRebalance?: () => void;
  onViewAllocation?: () => void;
}

export function AllocationDiagnosticsCard({ data, onRebalance, onViewAllocation }: AllocationDiagnosticsCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Allocation
          </CardTitle>
          {data.rebalanceNeeded && (
            <Badge variant="destructive">
              Rebalance Needed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Drift from Target</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min(data.driftAmount, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{data.driftAmount.toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Suggested Trades</p>
          <div className="space-y-1">
            {data.suggestedTrades.slice(0, 3).map((trade, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant={trade.action === 'buy' ? 'default' : 'secondary'}>
                    {trade.action.toUpperCase()}
                  </Badge>
                  <span className="font-medium">{trade.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{trade.shares} shares</p>
                  <p className="text-muted-foreground">${trade.estimatedValue.toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {onViewAllocation && (
            <Button size="sm" variant="outline" onClick={onViewAllocation} className="flex-1">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Allocation
            </Button>
          )}
          {onRebalance && (
            <Button size="sm" onClick={onRebalance} className="flex-1">
              <Target className="h-4 w-4 mr-2" />
              Rebalance
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}