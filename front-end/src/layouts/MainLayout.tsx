import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="w-full max-w-[1920px] mx-auto flex flex-col flex-1">
          <AppHeader />
          <main className="flex-1 w-full p-4">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
