import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SectionLoaderProps {
  className?: string
  rows?: number
}

export function SectionLoader({ className, rows = 3 }: SectionLoaderProps) {
  return (
    <div className={cn("space-y-4 w-full", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px] max-w-full" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  )
}
