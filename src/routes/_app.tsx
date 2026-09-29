import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/AppLayout.tsx'
import { requireAuthentication } from '@/router/auth-guards.ts'

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context }) => requireAuthentication(context),
  component: AppLayout,
})
