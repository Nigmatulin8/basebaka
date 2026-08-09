import { createFileRoute } from '@tanstack/react-router'
import { redirectIfAuthenticated } from '../../router/auth-guards.ts'
import { LoginPage } from './LoginPage.tsx'

export const Route = createFileRoute('/login/')({
  beforeLoad: ({ context }) => redirectIfAuthenticated(context),
  component: LoginPage,
})
