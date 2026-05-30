import { useState } from "react";
import type { ReactNode } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";


interface TriggerNumberFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  step: string;
  min: number;
  max?: number;
}

function TriggerNumberField<T extends FieldValues>({
  control,
  name,
  label,
  step,
  min,
  max,
}: TriggerNumberFieldProps<T>) {

  const [localValue, setLocalValue] = useState<string | null>(null);
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
              value={localValue ?? (Number.isFinite(field.value) ? String(field.value) : "")}
              onChange={(e) => {
                // Just track the raw string — don't commit to RHF yet.
                setLocalValue(e.target.value);
              }}
              onBlur={() => {
                // Commit to RHF on blur, then clear local override.
                const n = parseFloat(localValue ?? "");
                field.onChange(Number.isNaN(n) ? 0 : n);
                field.onBlur();
                setLocalValue(null);
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

export interface TriggerConfigSectionProps<T extends FieldValues> {
  control: Control<T>;
  enabledName: Path<T>;
  enabled: boolean;
  title: string;
  icon: ReactNode;
  thresholdName: Path<T>;
  thresholdLabel: string;
  thresholdMax?: number;
  sellPercentName: Path<T>;
}

export function TriggerConfigSection<T extends FieldValues>({
  control,
  enabledName,
  enabled,
  title,
  icon,
  thresholdName,
  thresholdLabel,
  thresholdMax,
  sellPercentName,
}: TriggerConfigSectionProps<T>) {
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
