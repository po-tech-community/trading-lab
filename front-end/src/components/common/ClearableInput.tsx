import type { InputProps } from "@/components/ui/input"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import * as React from "react"

export interface ClearableInputProps extends InputProps {
  onClear?: () => void
}

export const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ value, onChange, onClear, className, ...props }, ref) => {
    const handleClear = () => {
      if (onClear) {
        onClear()
      }
    }

    return (
      <Input
        value={value}
        onChange={onChange}
        ref={ref}
        className={className}
        endIcon={
          value || (typeof value === "string" && value.length > 0) ? (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
        {...props}
      />
    )
  }
)
ClearableInput.displayName = "ClearableInput"
