import { Outlet } from '@tanstack/react-router'
import { AppNavProvider } from '@/components/layout/AppNavProvider.tsx'
import { ServiceRail } from '@/components/layout/ServiceRail.tsx'
import { Sidebar } from '@/components/layout/Sidebar.tsx'

export function AppLayout() {
  return (
    <AppNavProvider>
      <div className="flex h-svh bg-base text-ink">
        <Sidebar />
        <ServiceRail />
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </AppNavProvider>
  )
}
