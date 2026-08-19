import { Outlet } from '@tanstack/react-router'
import { SideNav } from '@/components/layout/SideNav.tsx'

export function AppLayout() {
  return (
    <div className="flex min-h-svh bg-base text-ink">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
