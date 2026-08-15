import { redirect } from '@tanstack/react-router'
import {
  authQueryKeys,
  fetchAuthStatus,
  isAuthenticated,
  needsSignIn,
} from '@/lib/auth-api.ts'
import type { RouterContext } from './context.ts'

export async function loadAuthStatus(context: RouterContext) {
  return context.queryClient.fetchQuery({
    queryKey: authQueryKeys.status(context.port),
    queryFn: () => fetchAuthStatus(context.port),
  })
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
