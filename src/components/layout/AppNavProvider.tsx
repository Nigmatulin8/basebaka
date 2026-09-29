import { type ReactNode } from 'react'
import { AppNavContext, useAppNavState } from './use-app-nav.ts'

export function AppNavProvider({ children }: { children: ReactNode }) {
  const value = useAppNavState()
  return (
    <AppNavContext.Provider value={value}>{children}</AppNavContext.Provider>
  )
}
