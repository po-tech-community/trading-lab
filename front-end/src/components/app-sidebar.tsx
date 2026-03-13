"use client"

import {
    Bot,
    Database,
    Home,
    LayoutGrid,
    LineChart,
    PieChart,
    Settings2,
    Terminal
} from "lucide-react"
import * as React from "react"

import { useSession } from "@/hooks/use-auth"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/home",
          icon: Home,
        },
        {
          title: "DCA Backtest",
          url: "/home/backtest",
          icon: LineChart,
        },
        {
          title: "Portfolios",
          url: "/home/portfolio",
          icon: PieChart,
        },
      ],
    },
    {
      label: "Intelligence",
      items: [
        {
          title: "AI Advisor",
          url: "/home/ai-advisor",
          icon: Bot,
        },
        {
          title: "Market Data",
          url: "/home/market",
          icon: Database,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          title: "Settings",
          url: "/home/settings",
          icon: Settings2,
        },
        {
          title: "UI Components",
          url: "/ui-test-page",
          icon: Terminal,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useSession()

  const sidebarUser = {
    name: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "User",
    email: user?.email || "user@example.com",
    avatar: "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 overflow-hidden px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutGrid className="size-5" />
          </div>
          <div className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-sidebar-foreground">
              Trading Lab
            </span>
            <span className="truncate text-xs text-muted-foreground">
              DCA Simulator & AI Advisor
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
