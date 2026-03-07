import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current [&_[data-slot=alert-description]]:text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/20",
        success: "border-success/20",
        warning: "border-warning/20",
        info: "border-info/20",
      },
      mode: {
        solid: "border-transparent",
        subtle: "",
      },
    },
    compoundVariants: [
      // Subtle Variants (Default behavior for semantic types)
      {
        variant: "destructive",
        mode: "subtle",
        className: "text-destructive-subtle-foreground bg-destructive-subtle [&>svg]:text-destructive",
      },
      {
        variant: "success",
        mode: "subtle",
        className: "text-success-subtle-foreground bg-success-subtle [&>svg]:text-success",
      },
      {
        variant: "warning",
        mode: "subtle",
        className: "text-warning-subtle-foreground bg-warning-subtle [&>svg]:text-warning",
      },
      {
        variant: "info",
        mode: "subtle",
        className: "text-info-subtle-foreground bg-info-subtle [&>svg]:text-info",
      },
      // Solid Variants
      {
        variant: "destructive",
        mode: "solid",
        className: "text-destructive-foreground bg-destructive [&>svg]:text-destructive-foreground [&_[data-slot=alert-description]]:text-destructive-foreground/90",
      },
      {
        variant: "success",
        mode: "solid",
        className: "text-success-foreground bg-success [&>svg]:text-success-foreground [&_[data-slot=alert-description]]:text-success-foreground/90",
      },
      {
        variant: "warning",
        mode: "solid",
        className: "text-warning-foreground bg-warning [&>svg]:text-warning-foreground [&_[data-slot=alert-description]]:text-warning-foreground/90",
      },
      {
        variant: "info",
        mode: "solid",
        className: "text-info-foreground bg-info [&>svg]:text-info-foreground [&_[data-slot=alert-description]]:text-info-foreground/90",
      },
    ],
    defaultVariants: {
      variant: "default",
      mode: "subtle",
    },
  }
)

function Alert({
  className,
  variant,
  mode = "subtle",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-mode={mode}
      role="alert"
      className={cn(alertVariants({ variant, mode }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle }

