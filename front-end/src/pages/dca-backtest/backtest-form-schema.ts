import { z } from "zod";
import type { RunBacktestRequestBody } from "@/lib/backtest-api";

export const BACKTEST_SYMBOLS = ["BTC", "ETH", "AAPL", "TSLA"] as const;

const COINGECKO_LOOKBACK_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

function toIsoUtcDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function startOfUtcDay(epochMs: number): number {
  const d = new Date(epochMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function getTodayUtcIsoDate(): string {
  return toIsoUtcDate(startOfUtcDay(Date.now()));
}

export function getCryptoMinUtcIsoDate(): string {
  const today = startOfUtcDay(Date.now());
  const min = today - COINGECKO_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  return toIsoUtcDate(min);
}

export const backtestFormSchema = z
  .object({
    symbol: z.enum(BACKTEST_SYMBOLS),
    amount: z.number().positive("Amount must be greater than 0"),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    /** L3-FE-1 — optional TP/SL; not sent to API until backend accepts `triggers` (L3-BE-4). */
    takeProfitEnabled: z.boolean(),
    takeProfitThreshold: z.number(),
    takeProfitSellPercent: z.number(),
    stopLossEnabled: z.boolean(),
    stopLossThreshold: z.number(),
    stopLossSellPercent: z.number(),
  })
  .superRefine((data, ctx) => {
    const start = Date.parse(`${data.startDate}T00:00:00.000Z`);
    const end = Date.parse(`${data.endDate}T00:00:00.000Z`);

    if (Number.isNaN(start) || Number.isNaN(end)) return;

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after start date",
      });
    }
    const today = Date.parse(`${getTodayUtcIsoDate()}T00:00:00.000Z`);
    const rangeDays = Math.floor((end - start) / DAY_MS);

    if (rangeDays > COINGECKO_LOOKBACK_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Date range cannot exceed 365 days.",
      });
    }

    if (end > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be in the future.",
      });
    }

    if (data.takeProfitEnabled) {
      if (
        !Number.isFinite(data.takeProfitThreshold) ||
        data.takeProfitThreshold <= 0 ||
        data.takeProfitThreshold > 1000
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["takeProfitThreshold"],
          message: "Enter a profit threshold between 0 and 1000%.",
        });
      }
      if (
        !Number.isFinite(data.takeProfitSellPercent) ||
        data.takeProfitSellPercent < 1 ||
        data.takeProfitSellPercent > 100
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["takeProfitSellPercent"],
          message: "Sell amount must be between 1% and 100%.",
        });
      }
    }

    if (data.stopLossEnabled) {
      if (
        !Number.isFinite(data.stopLossThreshold) ||
        data.stopLossThreshold <= 0 ||
        data.stopLossThreshold > 100
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stopLossThreshold"],
          message: "Enter a drawdown threshold between 0 and 100%.",
        });
      }
      if (
        !Number.isFinite(data.stopLossSellPercent) ||
        data.stopLossSellPercent < 1 ||
        data.stopLossSellPercent > 100
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stopLossSellPercent"],
          message: "Sell amount must be between 1% and 100%.",
        });
      }
    }
  });

export type BacktestFormValues = z.infer<typeof backtestFormSchema>;

export function backtestFormValuesToRequest(
  values: BacktestFormValues,
): RunBacktestRequestBody {
  const triggers: RunBacktestRequestBody['triggers'] = {};
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
    symbol: values.symbol,
    amount: values.amount,
    frequency: values.frequency,
    startDate: Date.parse(`${values.startDate}T00:00:00.000Z`),
    endDate: Date.parse(`${values.endDate}T00:00:00.000Z`),
    triggers: Object.keys(triggers).length > 0 ? triggers : undefined,
  };
}
