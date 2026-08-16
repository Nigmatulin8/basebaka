import { Outlet } from '@tanstack/react-router'
import { AppHeader } from '@/components/auth/AppHeader.tsx'
import { SideNav } from '@/components/layout/SideNav.tsx'
import '@/components/auth/styles.scss'

export function AppLayout() {
  return (
    <div className="flex min-h-svh bg-base text-ink">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <Outlet />
      </div>
    </div>
  )
}
