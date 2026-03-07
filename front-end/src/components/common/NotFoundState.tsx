import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileQuestion } from "lucide-react"
// import { useNavigate } from "react-router-dom" // Typically used in implementation

interface NotFoundStateProps {
  title?: string
  description?: string
  className?: string
  onBack?: () => void
}

export function NotFoundState({
  title = "Page Not Found",
  description = "The module or resource you are looking for does not exist or has been moved.",
  className,
  onBack
}: NotFoundStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-[420px]">
        {description}
      </p>
      {onBack && (
        <Button variant="outline" onClick={onBack} className="mt-6">
          Go Back
        </Button>
      )}
    </div>
  )
}
