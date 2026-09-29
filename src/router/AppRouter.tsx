import { createRouter, RouterProvider } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { routeTree } from '@/routeTree.gen.ts'
import type { RouterContext } from './context.ts'

function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}

export function AppRouter() {
  const queryClient = useQueryClient()

  const router = useMemo(
    () => createAppRouter({ queryClient }),
    [queryClient],
  )

  return <RouterProvider router={router} />
}
