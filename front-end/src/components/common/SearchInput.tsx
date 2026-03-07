import type { InputProps } from "@/components/ui/input"
import { Input } from "@/components/ui/input"
import { Loader2, Search, X } from "lucide-react"
import * as React from "react"
import { useDebounce } from "use-debounce"

export interface SearchInputProps extends Omit<InputProps, "onChange"> {
  onChange?: (value: string) => void
  debounceTime?: number
  loading?: boolean
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, debounceTime = 300, loading = false, className, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(value?.toString() || "")
    const [debouncedValue] = useDebounce(localValue, debounceTime)

    React.useEffect(() => {
      if (value !== undefined && value !== localValue) {
        setLocalValue(value.toString())
      }
    }, [value])

    React.useEffect(() => {
      if (onChange && debouncedValue !== value) {
        onChange(debouncedValue)
      }
    }, [debouncedValue, onChange, value])

    const handleClear = () => {
      setLocalValue("")
      if (onChange) {
        onChange("")
      }
    }

    return (
      <Input
        ref={ref}
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={className}
        startIcon={<Search className="h-4 w-4" />}
        endIcon={
          loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : localValue ? (
            <button 
              type="button" 
              onClick={handleClear} 
              className="flex items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Clear search"
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
SearchInput.displayName = "SearchInput"
