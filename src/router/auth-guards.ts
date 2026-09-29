import { redirect } from '@tanstack/react-router'
import {
  authStatus,
  isAuthenticated,
  needsSignIn,
} from '@/lib/api'
import type { RouterContext } from './context.ts'

export async function loadAuthStatus(context: RouterContext) {
  return authStatus.prefetch(context.queryClient)
}

export async function redirectIfAuthenticated(context: RouterContext) {
  const status = await loadAuthStatus(context)
  if (isAuthenticated(status)) {
    throw redirect({ to: '/' })
  }
}

export async function requireAuthentication(context: RouterContext) {
  const status = await loadAuthStatus(context)
  if (needsSignIn(status)) {
    throw redirect({ to: '/login' })
  }
}
