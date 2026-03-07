import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this section. Please try again.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-[420px]">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-6">
          Try Again
        </Button>
      )}
    </div>
  )
}
