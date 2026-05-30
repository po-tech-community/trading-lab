/**
 * Zod schema for the portfolio backtest form.
 *
 * Key validation rules (L2-FE-1):
 *  - At least one asset required.
 *  - Each asset must have a unique symbol and a weight > 0.
 *  - Sum of all weights must equal exactly 100.
 *  - Date range must be ≤ 365 days (synced with DCA form validation).
 */

import { z } from "zod";
import type { RunPortfolioBacktestRequestBody } from "@/lib/backtest-api";

// ── Symbols (mirror backend's supported-symbols.ts) ─────────────────────────

export const PORTFOLIO_SYMBOLS = ["BTC", "ETH", "AAPL", "TSLA"] as const;
export type PortfolioSymbol = (typeof PORTFOLIO_SYMBOLS)[number];

// ── Single asset row ─────────────────────────────────────────────────────────

const assetRowSchema = z.object({
  symbol: z.enum(PORTFOLIO_SYMBOLS, {
    message: "Please select a valid symbol.",
  }),
  weight: z.coerce
    .number({ message: "Weight must be a number." })
    .int("Weight must be a whole number.")
    .min(1, "Weight must be at least 1%.")
    .max(100, "Weight cannot exceed 100%."),
});

// ── Full portfolio form schema ────────────────────────────────────────────────

export const portfolioFormSchema = z
  .object({
    assets: z
      .array(assetRowSchema)
      .min(1, "Add at least one asset.")
      .refine(
        (rows) => {
          const symbols = rows.map((r) => r.symbol);
          return new Set(symbols).size === symbols.length;
        },
        { message: "Each symbol can only appear once." },
      ),
    totalAmount: z.coerce
      .number({ message: "Amount must be a number." })
      .positive("Amount must be greater than 0."),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
    takeProfitEnabled: z.boolean(),
    takeProfitThreshold: z.number(),
    takeProfitSellPercent: z.number(),
    stopLossEnabled: z.boolean(),
    stopLossThreshold: z.number(),
    stopLossSellPercent: z.number(),
  })
  // Weights must sum to 100
  .refine(
    (data) => {
      const sum = data.assets.reduce(
        (acc, a) => acc + (Number(a.weight) || 0),
        0,
      );
      return sum === 100;
    },
    {
      message: "Weights must sum to exactly 100%.",
      path: ["assets"],
    },
  )
  // End date must be after start date
  .refine(
    (data) => {
      const start = Date.parse(`${data.startDate}T00:00:00.000Z`);
      const end = Date.parse(`${data.endDate}T00:00:00.000Z`);
      return !Number.isNaN(start) && !Number.isNaN(end) && end > start;
    },
    { message: "End date must be after start date.", path: ["endDate"] },
  )
  // Date range must be ≤ 365 days (synced with DCA backtest validation)
  .refine(
    (data) => {
      const start = Date.parse(`${data.startDate}T00:00:00.000Z`);
      const end = Date.parse(`${data.endDate}T00:00:00.000Z`);
      if (Number.isNaN(start) || Number.isNaN(end)) return true;
      const diffMs = end - start;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 365;
    },
    { message: "Date range cannot exceed 365 days.", path: ["endDate"] },
  )
  .refine(
    (data) => {
      if (!data.takeProfitEnabled) return true;
      return Number.isFinite(data.takeProfitThreshold) && data.takeProfitThreshold > 0 && data.takeProfitThreshold <= 1000;
    },
    { message: "Take profit threshold must be between 0.1% and 1000%.", path: ["takeProfitThreshold"] },
  )
  .refine(
    (data) => {
      if (!data.takeProfitEnabled) return true;
      return Number.isFinite(data.takeProfitSellPercent) && data.takeProfitSellPercent >= 1 && data.takeProfitSellPercent <= 100;
    },
    { message: "Sell % must be between 1 and 100.", path: ["takeProfitSellPercent"] },
  )
  .refine(
    (data) => {
      if (!data.stopLossEnabled) return true;
      return Number.isFinite(data.stopLossThreshold) && data.stopLossThreshold > 0 && data.stopLossThreshold <= 100;
    },
    { message: "Stop loss threshold must be between 0.1% and 100%.", path: ["stopLossThreshold"] },
  )
  .refine(
    (data) => {
      if (!data.stopLossEnabled) return true;
      return Number.isFinite(data.stopLossSellPercent) && data.stopLossSellPercent >= 1 && data.stopLossSellPercent <= 100;
    },
    { message: "Sell % must be between 1 and 100.", path: ["stopLossSellPercent"] },
  );

export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;

export function portfolioFormValuesToRequest(
  values: PortfolioFormValues,
): RunPortfolioBacktestRequestBody {

  const triggers: RunPortfolioBacktestRequestBody["triggers"] = {};
  if (values.takeProfitEnabled) {
    triggers.takeProfit = {
      threshold: values.takeProfitThreshold,
      sellAction: values.takeProfitSellPercent,
    };
  }
  if (values.stopLossEnabled) {
    triggers.stopLoss = {
      threshold: values.stopLossThreshold,
      sellAction: values.stopLossSellPercent,
    };
  }

  return {
    assets: values.assets.map((a) => ({ symbol: a.symbol, weight: a.weight })),
    totalAmount: values.totalAmount,
    frequency: values.frequency,
    startDate: Date.parse(`${values.startDate}T00:00:00.000Z`),
    endDate: Date.parse(`${values.endDate}T00:00:00.000Z`),
    triggers: Object.keys(triggers).length > 0 ? triggers : undefined,
  };
}
