import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  /** Optional label above the title (e.g. "Simulator engine v1.0") */
  label?: string
  /** Optional icon shown next to the label */
  icon?: LucideIcon
  /** Optional class for the icon (e.g. "fill-primary") */
  iconClassName?: string
  /** Main page title */
  title: string
  /** Optional description below the title */
  description?: string
  /** Optional actions (buttons) on the right side */
  actions?: React.ReactNode
  /** Optional extra class for the wrapper */
  className?: string
}

export function PageHeader({
  label,
  icon: Icon,
  iconClassName,
  title,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={[
        "flex flex-col md:flex-row md:items-end justify-between gap-4",
        className,
      ].join(" ")}
    >
      <div className="space-y-1">
        {label && (
          <div className="flex items-center gap-2 text-primary text-sm">
            {Icon && <Icon className={["size-4", iconClassName].filter(Boolean).join(" ")} />}
            {label}
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground max-w-2xl text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
