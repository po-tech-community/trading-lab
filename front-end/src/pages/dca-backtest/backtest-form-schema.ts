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
  });

export type BacktestFormValues = z.infer<typeof backtestFormSchema>;

export function backtestFormValuesToRequest(
  values: BacktestFormValues,
): RunBacktestRequestBody {
  return {
    symbol: values.symbol,
    amount: values.amount,
    frequency: values.frequency,
    startDate: Date.parse(`${values.startDate}T00:00:00.000Z`),
    endDate: Date.parse(`${values.endDate}T00:00:00.000Z`),
  };
}
