import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"
import { Slot } from "radix-ui"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "focus-visible:ring-ring/50",
        destructive:
          "text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        success:
          "text-success-foreground focus-visible:ring-success/20",
        warning:
          "text-warning-foreground focus-visible:ring-warning/20",
        info:
          "text-info-foreground focus-visible:ring-info/20",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      mode: {
        solid: "",
        subtle: "",
        outline: "border shadow-xs bg-background",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    compoundVariants: [
      // Solid Modes (Default backgrounds move here)
      {
        variant: "default",
        mode: "solid",
        className: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      {
        variant: "destructive",
        mode: "solid",
        className: "bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60",
      },
      {
        variant: "success",
        mode: "solid",
        className: "bg-success text-success-foreground hover:bg-success/90",
      },
      {
        variant: "warning",
        mode: "solid",
        className: "bg-warning text-warning-foreground hover:bg-warning/90",
      },
      {
        variant: "info",
        mode: "solid",
        className: "bg-info text-info-foreground hover:bg-info/90",
      },
      
      // Subtle Modes
      {
        variant: "destructive",
        mode: "subtle",
        className: "bg-destructive-subtle text-destructive-subtle-foreground hover:bg-destructive-subtle/80",
      },
      {
        variant: "destructive",
        mode: "outline",
        className: "border-destructive text-destructive bg-background hover:bg-destructive/10",
      },
      {
        variant: "success",
        mode: "subtle",
        className: "bg-success-subtle text-success-subtle-foreground hover:bg-success-subtle/80",
      },
      {
        variant: "success",
        mode: "outline",
        className: "border-success text-success bg-background hover:bg-success/10",
      },
      {
        variant: "warning",
        mode: "subtle",
        className: "bg-warning-subtle text-warning-subtle-foreground hover:bg-warning-subtle/80",
      },
      {
        variant: "warning",
        mode: "outline",
        className: "border-warning text-warning bg-background hover:bg-warning/10",
      },
      {
        variant: "info",
        mode: "subtle",
        className: "bg-info-subtle text-info-subtle-foreground hover:bg-info-subtle/80",
      },
      {
        variant: "info",
        mode: "outline",
        className: "border-info text-info bg-background hover:bg-info/10",
      },
    ],
    defaultVariants: {
      variant: "default",
      mode: "solid",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  iconOnly?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      mode = "solid",
      size = "default",
      asChild = false,
      loading = false,
      startIcon,
      endIcon,
      iconOnly = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot.Root : "button"
    const appliedSize = iconOnly ? "icon" : size

    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-mode={mode}
        data-size={appliedSize}
        className={cn(buttonVariants({ variant, mode, size: appliedSize, className }), fullWidth && "w-full")}
        disabled={loading || disabled}
        aria-busy={loading ? "true" : undefined}
        ref={ref}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <Loader2Icon className="animate-spin size-4 shrink-0" />
            ) : startIcon ? (
              startIcon
            ) : null}
            {children}
            {endIcon && !loading ? endIcon : null}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
