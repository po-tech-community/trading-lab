/** Single source of truth for symbols accepted by {@link PriceService} and backtest DTOs. */
export const SUPPORTED_BACKTEST_SYMBOLS = ['BTC', 'ETH', 'AAPL', 'TSLA'] as const;

export type SupportedBacktestSymbol = (typeof SUPPORTED_BACKTEST_SYMBOLS)[number];
