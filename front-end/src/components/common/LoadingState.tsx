import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  className?: string
  message?: string
}

export function LoadingState({ className, message }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center gap-4 p-8",
        className
      )}
    >
      <Spinner className="h-12 w-12 text-primary" aria-hidden />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  )
}
