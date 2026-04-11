import type { ReactNode } from "react";
import type { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { BacktestFormValues } from "./backtest-form-schema";

type TriggerEnabledField = "takeProfitEnabled" | "stopLossEnabled";
type TriggerThresholdField = "takeProfitThreshold" | "stopLossThreshold";
type TriggerSellPercentField = "takeProfitSellPercent" | "stopLossSellPercent";

interface TriggerNumberFieldProps {
  control: Control<BacktestFormValues>;
  name: TriggerThresholdField | TriggerSellPercentField;
  label: string;
  step: string;
  min: number;
  max?: number;
}

function TriggerNumberField({
  control,
  name,
  label,
  step,
  min,
  max,
}: TriggerNumberFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1.5 space-y-0">
          <FormLabel className="text-xs text-muted-foreground">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              min={min}
              max={max}
              className="h-9"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={Number.isFinite(field.value) ? field.value : ""}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                field.onChange(Number.isNaN(n) ? 0 : n);
              }}
            />
          </FormControl>
          <div className="text-xs leading-snug">
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

export interface TriggerConfigSectionProps {
  control: Control<BacktestFormValues>;
  enabledName: TriggerEnabledField;
  enabled: boolean;
  title: string;
  icon: ReactNode;
  thresholdName: TriggerThresholdField;
  thresholdLabel: string;
  thresholdMax?: number;
  sellPercentName: TriggerSellPercentField;
}

export function TriggerConfigSection({
  control,
  enabledName,
  enabled,
  title,
  icon,
  thresholdName,
  thresholdLabel,
  thresholdMax,
  sellPercentName,
}: TriggerConfigSectionProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
        </div>
        <FormField
          control={control}
          name={enabledName}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {enabled ? (
        <div className="grid grid-cols-2 gap-3 pt-1 items-start">
          <TriggerNumberField
            control={control}
            name={thresholdName}
            label={thresholdLabel}
            step="0.1"
            min={0.1}
            max={thresholdMax}
          />
          <TriggerNumberField
            control={control}
            name={sellPercentName}
            label="Sell (% position)"
            step="1"
            min={1}
            max={100}
          />
        </div>
      ) : null}
    </div>
  );
}
