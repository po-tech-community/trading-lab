/**
 * L2-FE-1 — Asset list component
 *
 * Dynamic list where each row = symbol selector + weight (%).
 * Rules:
 *  - At least one row required.
 *  - Symbols must be unique across rows.
 *  - Sum of weights must equal exactly 100 %.
 *  - Submit is blocked (button disabled) until the sum is valid.
 *  - Inline validation error shown when sum ≠ 100 %.
 */
 
import { useCallback } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import type { PortfolioFormValues } from "@/pages/portfolio-backtest/portfolio-form-schema"
 
// ── Constants ────────────────────────────────────────────────────────────────
 
export const SUPPORTED_SYMBOLS = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "AAPL", label: "Apple (AAPL)" },
  { value: "TSLA", label: "Tesla (TSLA)" },
] as const
 
// ── Sub-components ────────────────────────────────────────────────────────────
 
interface WeightSummaryBarProps {
  total: number
}
 
function WeightSummaryBar({ total }: WeightSummaryBarProps) {
  const isValid = total === 100
  const isOver = total > 100
  const fillWidth = Math.min(total, 100)
 
  return (
    <div className="space-y-1.5">
      {/* Progress track */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isValid
              ? "bg-emerald-500"
              : isOver
                ? "bg-destructive"
                : "bg-primary/60"
          )}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
 
      {/* Label row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Total allocation</span>
        <span
          className={cn(
            "font-semibold tabular-nums flex items-center gap-1",
            isValid
              ? "text-emerald-600"
              : isOver
                ? "text-destructive"
                : "text-muted-foreground"
          )}
        >
          {isValid ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <AlertCircle className="size-3.5" />
          )}
          {total}%
        </span>
      </div>
 
      {/* Validation message */}
      {!isValid && (
        <p className="text-xs text-destructive flex items-start gap-1" role="alert">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          {total === 0
            ? "Add at least one asset with a weight."
            : isOver
              ? `Over by ${total - 100}% — reduce weights to reach exactly 100%.`
              : `${100 - total}% remaining — weights must sum to exactly 100%.`}
        </p>
      )}
    </div>
  )
}
 
// ── Main component ────────────────────────────────────────────────────────────
 
export interface AssetListProps {
  /** Name of the field array inside the parent react-hook-form context */
  fieldArrayName?: "assets"
}
 
export function AssetList({ fieldArrayName = "assets" }: AssetListProps) {
  const form = useFormContext<PortfolioFormValues>()
 
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: fieldArrayName,
  })
 
  // Derive totals live from watched values
  const assets = form.watch(fieldArrayName)
  const total = assets.reduce((sum, a) => sum + (Number(a.weight) || 0), 0)
  const isWeightValid = total === 100
 
  // Symbols currently in use — used to disable already-chosen options in other rows
  const usedSymbols = assets.map((a) => a.symbol).filter(Boolean)
 
  const handleAdd = useCallback(() => {
    // Pick first symbol not already used, or fall back to "BTC"
    const nextSymbol =
      SUPPORTED_SYMBOLS.find((s) => !usedSymbols.includes(s.value))?.value ?? "BTC"
    append({ symbol: nextSymbol, weight: 0 })
  }, [append, usedSymbols])
 
  const canAdd = fields.length < SUPPORTED_SYMBOLS.length
 
  return (
    <div className="space-y-3">
      {/* ── Column headers ── */}
      <div className="grid grid-cols-[1fr_100px_36px] gap-2 px-1">
        <span className="text-xs text-muted-foreground font-medium">Symbol</span>
        <span className="text-xs text-muted-foreground font-medium">Weight (%)</span>
        <span />
      </div>
 
      {/* ── Rows ── */}
      <div className="space-y-2">
        {fields.map((field, index) => {
          const rowSymbol = assets[index]?.symbol
 
          return (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_100px_36px] gap-2 items-start"
            >
              {/* Symbol selector */}
              <FormField
                control={form.control}
                name={`${fieldArrayName}.${index}.symbol`}
                render={({ field: f }) => (
                  <FormItem className="space-y-1">
                    <Select onValueChange={f.onChange} value={f.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 bg-background/50 border-border/60 hover:border-primary/40 transition-colors font-medium text-sm">
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPORTED_SYMBOLS.map((s) => (
                          <SelectItem
                            key={s.value}
                            value={s.value}
                            // Disable if used in another row (but allow selecting current row's own symbol)
                            disabled={
                              usedSymbols.includes(s.value) && s.value !== rowSymbol
                            }
                            className="text-sm"
                          >
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
 
              {/* Weight input */}
              <FormField
                control={form.control}
                name={`${fieldArrayName}.${index}.weight`}
                render={({ field: f }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          placeholder="0"
                          className="h-9 pr-7 text-sm font-medium tabular-nums"
                          name={f.name}
                          ref={f.ref}
                          onBlur={f.onBlur}
                          value={Number.isFinite(Number(f.value)) && Number(f.value) !== 0 ? f.value : ""}
                          onChange={(e) => {
                            const n = e.target.valueAsNumber
                            f.onChange(Number.isNaN(n) ? 0 : n)
                          }}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
 
              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
                aria-label={`Remove row ${index + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )
        })}
      </div>
 
      {/* ── Add row button ── */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-8 border-dashed text-xs gap-1.5 hover:border-primary/50 hover:text-primary transition-colors"
        onClick={handleAdd}
        disabled={!canAdd}
      >
        <Plus className="size-3.5" />
        Add asset
        {!canAdd && " (all symbols added)"}
      </Button>
 
      {/* ── Weight summary bar + validation ── */}
      <div className="pt-1">
        <WeightSummaryBar total={total} />
      </div>
 
      {/*
        Hidden field-level error for the whole `assets` array (e.g. refinements).
        react-hook-form surfaces array-level errors at the root name.
      */}
      {(form.formState.errors as Record<string, { message?: string }>)[fieldArrayName]
        ?.message && (
        <p className="text-xs text-destructive flex items-center gap-1" role="alert">
          <AlertCircle className="size-3.5 shrink-0" />
          {
            (form.formState.errors as Record<string, { message?: string }>)[
              fieldArrayName
            ]?.message
          }
        </p>
      )}
 
      {/* Expose derived validity so callers can read it from the form context */}
      <input type="hidden" data-testid="weight-valid" data-valid={isWeightValid} />
    </div>
  )
}
 