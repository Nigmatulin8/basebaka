import { createFileRoute } from '@tanstack/react-router'
import { requireAuthentication } from '@/router/auth-guards.ts'
import { HomePage } from './HomePage.tsx'

export const Route = createFileRoute('/home/')({
  beforeLoad: ({ context }) => requireAuthentication(context),
  component: HomePage,
})
