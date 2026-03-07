"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { XIcon, type LucideIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import * as React from "react"

import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // Re-import if using default footer closes

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

const dialogContentVariants = cva(
  "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 flex flex-col w-full rounded-lg border shadow-lg duration-200 outline-none max-h-[85vh]",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[95vw]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface DialogContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  showCloseButton?: boolean
  loading?: boolean
  preventCloseOnLoading?: boolean
}

function DialogContent({
  className,
  children,
  size,
  showCloseButton = true,
  loading = false,
  preventCloseOnLoading = false,
  onInteractOutside,
  onEscapeKeyDown,
  ...props
}: DialogContentProps) {
  const isClosePrevented = loading && preventCloseOnLoading

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto justify-items-center p-2 sm:p-4 pointer-events-none">
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn(dialogContentVariants({ size }), className, "pointer-events-auto")}
          aria-busy={loading}
          onInteractOutside={(e) => {
            if (isClosePrevented) e.preventDefault()
            onInteractOutside?.(e)
          }}
          onEscapeKeyDown={(e) => {
            if (isClosePrevented) e.preventDefault()
            onEscapeKeyDown?.(e)
          }}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              disabled={isClosePrevented}
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  )
}

interface DialogHeaderProps extends React.ComponentProps<"div"> {
  icon?: LucideIcon
  variant?: "default" | "destructive"
  hideBorder?: boolean
  compact?: boolean
}

function DialogHeader({ 
  className, 
  icon: Icon, 
  variant = "default", 
  hideBorder = false,
  compact = false,
  children, 
  ...props 
}: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex items-start gap-4 shrink-0",
        !hideBorder && "border-b",
        compact ? "px-4 pt-4 pb-2" : "px-6 pt-6 pb-4",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className={cn(compact ? "mt-0" : "mt-0.5", "shrink-0", variant === "destructive" ? "text-destructive" : "text-muted-foreground")}>
          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        </div>
      )}
      <div className="flex flex-col gap-1 text-left flex-1">
        {children}
      </div>
    </div>
  )
}

interface DialogBodyProps extends React.ComponentProps<"div"> {
  compact?: boolean
}

function DialogBody({ className, compact = false, ...props }: DialogBodyProps) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "flex-1 min-h-0 overflow-y-auto space-y-4", 
        compact ? "px-4 py-2" : "px-6 py-4",
        className
      )}
      {...props}
    />
  )
}

interface DialogFooterProps extends React.ComponentProps<"div"> {
  hideBorder?: boolean
  compact?: boolean
}

function DialogFooter({
  className,
  hideBorder = false,
  compact = false,
  children,
  ...props
}: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end shrink-0",
        !hideBorder && "border-t shadow-[0_-10px_15px_-15px_rgba(0,0,0,0.1)]",
        compact ? "px-4 pt-2 pb-4" : "px-6 pt-4 pb-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, type DialogBodyProps,
  type DialogFooterProps, type DialogHeaderProps
}

