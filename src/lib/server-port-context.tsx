import { type ReactNode } from 'react'
import { setSidecarPort } from './sidecar-client.ts'

export function ServerPortProvider({
  port,
  children,
}: {
  port: number
  children: ReactNode
}) {
  setSidecarPort(port)
  return children
}
