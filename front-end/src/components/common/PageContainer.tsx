import { cn } from "@/lib/utils"
import * as React from "react"

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PageContainer({ className, children, ...props }: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6", className)}
      {...props}
    >
      {children}
    </div>
  )
}
