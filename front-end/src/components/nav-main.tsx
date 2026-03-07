import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export type NavMainItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: { title: string; url: string }[]
}

export type NavMainGroup = {
  label: string
  items: NavMainItem[]
}

export function NavMain({ groups }: { groups: NavMainGroup[] }) {
  const location = useLocation()

  const isPathActive = (url: string) => {
    if (url === "#" || url === "") return false
    if (url === "/") return location.pathname === "/"
    return location.pathname.startsWith(url)
  }

  const hasActiveChild = (items: { title: string; url: string }[] | undefined) =>
    items?.some((sub) => isPathActive(sub.url)) ?? false

  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={groupIndex}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const active = isPathActive(item.url) || hasActiveChild(item.items)
              if (item.items?.length) {
                return (
                  <Collapsible
                    key={item.title + groupIndex}
                    asChild
                    defaultOpen={active}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={active}
                          asChild
                        >
                          <Link to={item.url === "#" ? "#" : item.url}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </Link>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isPathActive(subItem.url)}
                              >
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }
              return (
                <SidebarMenuItem key={item.title + groupIndex}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isPathActive(item.url)}
                    asChild
                  >
                    <Link to={item.url === "#" ? "#" : item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
