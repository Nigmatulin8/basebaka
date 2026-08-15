import { createFileRoute } from '@tanstack/react-router'
import { requireAuthentication } from '@/router/auth-guards.ts'
import { HomePage } from './home/HomePage.tsx'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => requireAuthentication(context),
  component: HomePage,
})
