import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FolderOpen } from "lucide-react"
import * as React from "react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          {icon ? icon : <FolderOpen className="h-10 w-10 text-muted-foreground" />}
        </div>
        <h2 className="mt-6 text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-[420px]">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-6">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
