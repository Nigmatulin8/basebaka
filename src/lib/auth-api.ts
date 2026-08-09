import { useQuery } from '@tanstack/react-query'
import type { AuthStatusResponse, GoogleAuthStartResponse } from '../../shared/auth.ts'
import { useServerPort } from './server-port-context.tsx'
import { readSidecarErrorMessage, sidecarFetch } from './sidecar-client.ts'

export const GOOGLE_SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000

const GOOGLE_SIGN_IN_POLL_MS = 1500

export const authQueryKeys = {
  status: (port: number) => ['auth', 'status', port] as const,
}

const OUTDATED_SIDECAR =
  'Local server is outdated. Run `pnpm build:sidecar` and restart the app, or `pnpm dev:server` in browser dev.'

function parseAuthStatus(body: unknown): AuthStatusResponse {
  if (
    body &&
    typeof body === 'object' &&
    'status' in body &&
    typeof (body as AuthStatusResponse).status === 'string'
  ) {
    return body as AuthStatusResponse
  }
  throw new Error(OUTDATED_SIDECAR)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useAuthStatus() {
  const port = useServerPort()
  return useQuery({
    queryKey: authQueryKeys.status(port),
    queryFn: () => fetchAuthStatus(port),
    retry: 1,
  })
}

export async function fetchAuthStatus(port: number): Promise<AuthStatusResponse> {
  const res = await sidecarFetch(port, '/auth/status')
  if (!res.ok) {
    throw new Error(`Auth status failed (${res.status})`)
  }
  return parseAuthStatus(await res.json())
}

export async function waitForGoogleSignIn(port: number): Promise<boolean> {
  const deadline = Date.now() + GOOGLE_SIGN_IN_TIMEOUT_MS
  while (Date.now() < deadline) {
    await sleep(GOOGLE_SIGN_IN_POLL_MS)
    if ((await fetchAuthStatus(port)).status === 'authenticated') {
      return true
    }
  }
  return false
}

export async function startGoogleSignIn(port: number): Promise<GoogleAuthStartResponse> {
  const res = await sidecarFetch(port, '/auth/google/start', { method: 'POST' })
  if (!res.ok) {
    throw new Error((await readSidecarErrorMessage(res)) ?? `Sign-in start failed (${res.status})`)
  }
  return res.json() as Promise<GoogleAuthStartResponse>
}

export async function logoutAuth(port: number): Promise<void> {
  const res = await sidecarFetch(port, '/auth/logout', { method: 'POST' })
  if (!res.ok) {
    throw new Error(`Logout failed (${res.status})`)
  }
}

export function isAuthenticated(
  auth: AuthStatusResponse | undefined,
): auth is Extract<AuthStatusResponse, { status: 'authenticated' }> {
  return auth?.status === 'authenticated'
}

export function needsSignIn(auth: AuthStatusResponse | undefined): boolean {
  if (!auth) {
    return true
  }
  return (
    auth.status === 'unauthenticated' ||
    auth.status === 'requiresReauth' ||
    auth.status === 'misconfigured'
  )
}
