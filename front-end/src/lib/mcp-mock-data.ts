// Mock data generators for MCP components
import type { MarketSnapshotData, RiskCheckData, AllocationDiagnosticsData } from '@/components/mcp/ResultCards';

export function generateMarketSnapshot(symbol: string = 'AAPL'): MarketSnapshotData {
  const basePrice = symbol === 'AAPL' ? 175 : symbol === 'MSFT' ? 335 : 140;
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol,
    price: basePrice + change,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 100000000) + 10000000,
    marketCap: Math.floor(Math.random() * 3000000000000) + 500000000000,
    peRatio: Math.random() * 40 + 10,
    dividendYield: Math.random() * 3 + 0.1
  };
}

export function generateRiskCheck(): RiskCheckData {
  const riskLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  const overallRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];

  return {
    overallRisk,
    volatility: Math.random() * 30 + 5,
    sharpeRatio: Math.random() * 3 + 0.5,
    maxDrawdown: -(Math.random() * 20 + 5),
    beta: Math.random() * 2 + 0.5,
    var95: -(Math.random() * 15 + 5),
    stressTestResult: overallRisk === 'high'
      ? 'Portfolio shows elevated risk under stress conditions'
      : 'Portfolio passed stress test with acceptable losses'
  };
}

export function generateAllocationDiagnostics(): AllocationDiagnosticsData {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];
  const currentAllocation: Record<string, number> = {};
  const targetAllocation: Record<string, number> = {};

  // Generate current allocation
  let totalCurrent = 0;
  symbols.forEach(symbol => {
    const weight = Math.random() * 0.5 + 0.1;
    currentAllocation[symbol] = weight;
    totalCurrent += weight;
  });

  // Normalize current allocation
  Object.keys(currentAllocation).forEach(symbol => {
    currentAllocation[symbol] = currentAllocation[symbol] / totalCurrent;
  });

  // Generate target allocation
  let totalTarget = 0;
  symbols.forEach(symbol => {
    const weight = Math.random() * 0.4 + 0.15;
    targetAllocation[symbol] = weight;
    totalTarget += weight;
  });

  // Normalize target allocation
  Object.keys(targetAllocation).forEach(symbol => {
    targetAllocation[symbol] = targetAllocation[symbol] / totalTarget;
  });

  // Calculate drift
  const driftAmount = Math.random() * 20 + 5;

  // Generate suggested trades
  const suggestedTrades = symbols
    .filter(symbol => Math.abs(currentAllocation[symbol] - targetAllocation[symbol]) > 0.05)
    .map(symbol => {
      const currentWeight = currentAllocation[symbol];
      const targetWeight = targetAllocation[symbol];
      const action: 'buy' | 'sell' = currentWeight > targetWeight ? 'sell' : 'buy';
      const shares = Math.floor(Math.random() * 50) + 10;
      const estimatedValue = shares * (Math.random() * 200 + 100);

      return { symbol, action, shares, estimatedValue };
    });

  return {
    currentAllocation,
    targetAllocation,
    rebalanceNeeded: driftAmount > 10,
    driftAmount,
    suggestedTrades
  };
}

// Mock execution data for different tool types
export const mockToolExecutions = {
  marketData: {
    toolName: "Market Data Fetcher",
    purpose: "Retrieve real-time market data for major tech stocks",
    inputPreview: {
      symbols: ["AAPL", "MSFT", "GOOGL", "TSLA"],
      timeframe: "1D",
      includeFundamentals: true,
      dataPoints: ["price", "volume", "marketCap", "peRatio"]
    }
  },

  riskAnalysis: {
    toolName: "Risk Analyzer",
    purpose: "Calculate comprehensive risk metrics for portfolio",
    inputPreview: {
      portfolio: ["AAPL", "MSFT", "GOOGL"],
      weights: [0.4, 0.3, 0.3],
      benchmark: "SPY",
      riskMetrics: ["volatility", "sharpeRatio", "maxDrawdown", "beta", "var95"]
    }
  },

  portfolioOptimization: {
    toolName: "Portfolio Optimizer",
    purpose: "Analyze allocation drift and generate rebalancing recommendations",
    inputPreview: {
      currentHoldings: { AAPL: 100, MSFT: 50, GOOGL: 75 },
      targetAllocation: { AAPL: 0.35, MSFT: 0.35, GOOGL: 0.30 },
      totalValue: 50000,
      constraints: { minWeight: 0.05, maxWeight: 0.5 }
    }
  },

  backtest: {
    toolName: "Strategy Backtester",
    purpose: "Test trading strategy performance over historical data",
    inputPreview: {
      strategy: "momentum",
      symbols: ["SPY", "QQQ"],
      startDate: "2020-01-01",
      endDate: "2024-01-01",
      initialCapital: 100000
    }
  }
};

// Helper function to get random mock execution
export function getRandomMockExecution() {
  const executions = Object.values(mockToolExecutions);
  return executions[Math.floor(Math.random() * executions.length)];
}