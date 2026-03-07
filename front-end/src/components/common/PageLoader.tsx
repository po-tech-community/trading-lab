import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  className?: string
  message?: string
}

export function PageLoader({ className, message }: PageLoaderProps) {
  return (
    <div className={cn("flex min-h-[50vh] flex-col items-center justify-center space-y-4", className)}>
      <Spinner className="h-8 w-8 text-primary" />
      {message && <p className="text-sm text-muted-foreground animate-pulse">{message}</p>}
    </div>
  )
}
