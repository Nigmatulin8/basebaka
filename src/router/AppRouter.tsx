import { createRouter, RouterProvider } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { routeTree } from '@/routeTree.gen.ts'
import { useServerPort } from '@/lib/server-port-context.tsx'
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
  const port = useServerPort()
  const queryClient = useQueryClient()

  const router = useMemo(
    () => createAppRouter({ port, queryClient }),
    [port, queryClient],
  )

  return <RouterProvider router={router} />
}
