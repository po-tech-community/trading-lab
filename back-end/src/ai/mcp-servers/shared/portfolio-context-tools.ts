export interface PortfolioContextAssetWeight {
  symbol: string;
  weight: number;
}

export interface PortfolioContextSnapshot {
  mode: 'single' | 'portfolio';
  title: string;
  generatedAt: string;
  summary: {
    totalInvested: number;
    currentValue: number;
    totalReturnPercentage: number;
    realizedProfit?: number;
    unrealizedValue?: number;
  };
  assets?: PortfolioContextAssetWeight[];
  timelineSample?: Array<{
    date: string;
    value: number;
  }>;
}

export function getConcentrationRisk(weights: PortfolioContextAssetWeight[]) {
  const normalized = weights.map((item) => ({
    symbol: item.symbol.trim().toUpperCase(),
    weight: item.weight,
  }));
  if (normalized.length === 0) {
    return {
      totalWeight: 0,
      largestPosition: {
        symbol: 'N/A',
        weight: 0,
      },
      concentrationScore: 0,
      riskLevel: 'low' as const,
    };
  }
  const totalWeight = normalized.reduce((sum, item) => sum + item.weight, 0);
  const largest = normalized.reduce((current, item) =>
    item.weight > current.weight ? item : current,
  );
  const hhi = normalized.reduce((sum, item) => sum + item.weight ** 2, 0);

  return {
    totalWeight: Number(totalWeight.toFixed(4)),
    largestPosition: largest,
    concentrationScore: Number(hhi.toFixed(4)),
    riskLevel: hhi >= 0.25 ? 'high' : hhi >= 0.15 ? 'medium' : 'low',
  };
}

export function getDrawdownBreakdown(
  context: PortfolioContextSnapshot,
  weights: PortfolioContextAssetWeight[],
) {
  const values = context.timelineSample?.map((point) => point.value) ?? [];
  const peak = values.length > 0 ? Math.max(...values) : context.summary.currentValue;
  const trough = values.length > 0 ? Math.min(...values) : context.summary.currentValue;
  const portfolioMaxDrawdownPercent =
    peak > 0 ? Number((((peak - trough) / peak) * 100).toFixed(2)) : 0;

  const assets = weights.map((item) => {
    const estimatedDrawdown = Number(
      (portfolioMaxDrawdownPercent * Math.max(item.weight, 0.05)).toFixed(2),
    );

    return {
      symbol: item.symbol.trim().toUpperCase(),
      maxDrawdownPercent: estimatedDrawdown,
      recoveryDaysEstimate: Math.max(3, Math.round(estimatedDrawdown * 1.5)),
    };
  });

  return {
    assets,
    portfolioMaxDrawdownPercent,
  };
}

export function getAssetContribution(
  context: PortfolioContextSnapshot,
  weights: PortfolioContextAssetWeight[],
) {
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0) || 1;

  return weights.map((item) => {
    const normalizedWeight = item.weight / totalWeight;
    const contributionPercent = Number(
      (context.summary.totalReturnPercentage * normalizedWeight).toFixed(3),
    );

    return {
      symbol: item.symbol.trim().toUpperCase(),
      weight: item.weight,
      contributionPercent,
    };
  });
}
