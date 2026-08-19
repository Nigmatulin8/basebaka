import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from './-HomePage.tsx'

export const Route = createFileRoute('/_app/home/')({
  component: HomePage,
})
