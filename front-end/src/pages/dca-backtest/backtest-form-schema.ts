import { z } from "zod"
import type { RunBacktestRequestBody } from "@/lib/backtest-api"

export const BACKTEST_SYMBOLS = ["BTC", "ETH", "AAPL", "TSLA"] as const

export const backtestFormSchema = z
  .object({
    symbol: z.enum(BACKTEST_SYMBOLS),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) => {
      const start = Date.parse(`${data.startDate}T00:00:00.000Z`)
      const end = Date.parse(`${data.endDate}T00:00:00.000Z`)
      return !Number.isNaN(start) && !Number.isNaN(end) && end > start
    },
    { message: "End date must be after start date", path: ["endDate"] },
  )

export type BacktestFormValues = z.infer<typeof backtestFormSchema>

export function backtestFormValuesToRequest(values: BacktestFormValues): RunBacktestRequestBody {
  return {
    symbol: values.symbol,
    amount: values.amount,
    frequency: values.frequency,
    startDate: Date.parse(`${values.startDate}T00:00:00.000Z`),
    endDate: Date.parse(`${values.endDate}T00:00:00.000Z`),
  }
}
