import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import * as React from "react"

export interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  // Prevent default behavior if onConfirm performs an async task directly
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onCancel()}>
      <DialogContent size="sm" loading={loading} preventCloseOnLoading>
        <DialogHeader 
          variant={variant === "destructive" ? "destructive" : "default"}
          compact
          hideBorder
        >
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <DialogBody compact>
             <p className="text-muted-foreground text-sm">{description}</p>
          </DialogBody>
        )}
        <DialogFooter compact hideBorder>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={handleConfirm} loading={loading}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
