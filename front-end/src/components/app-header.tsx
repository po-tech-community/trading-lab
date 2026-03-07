import { ThemeSwitch } from "@/components/theme-switch"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Link, useMatches } from "react-router-dom"

type BreadcrumbHandle = { breadcrumb?: string }

export function AppHeader() {
  const matches = useMatches() as Array<{
    handle?: BreadcrumbHandle
    pathname: string
  }>

  const crumbs = matches.filter(
    (m): m is typeof m & { handle: { breadcrumb: string } } =>
      typeof (m.handle as BreadcrumbHandle)?.breadcrumb === "string"
  )

  const items = [
    { label: "Trading Lab", pathname: "/" },
    ...crumbs.map((m) => ({ label: m.handle.breadcrumb, pathname: m.pathname })),
  ]

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full px-4 border-b border-border/40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, i) => (
              <span key={`${i}-${item.pathname}`} className="contents">
                {i > 0 && (
                  <BreadcrumbSeparator className="hidden md:inline-flex" />
                )}
                <BreadcrumbItem className="hidden md:inline-flex">
                  {i === items.length - 1 ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={item.pathname}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitch />
      </div>
    </header>
  )
}
