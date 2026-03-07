import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface InlineLoaderProps {
  className?: string
  text?: string
}

export function InlineLoader({ className, text }: InlineLoaderProps) {
  return (
    <div className={cn("inline-flex items-center space-x-2 text-muted-foreground", className)}>
      <Spinner className="h-4 w-4" />
      {text && <span className="text-sm">{text}</span>}
    </div>
  )
}
