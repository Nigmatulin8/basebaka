import type {
  AuthStatusResponse,
  GoogleAuthStartResponse,
} from '@shared/auth.ts'
import {
  createSidecarQuery,
  getJson,
  postJson,
  postVoid,
} from '../sidecar-api.ts'

const OUTDATED_SIDECAR =
  'Local server is outdated. Run `pnpm build:sidecar` and restart the app, or `pnpm dev:server` in browser dev.'

export const GOOGLE_SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000

const GOOGLE_SIGN_IN_POLL_MS = 1500

async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  const body = await getJson<unknown>('/auth/status')
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

export const authStatus = createSidecarQuery(['auth', 'status'], fetchAuthStatus)
export const useAuthStatus = authStatus.use

export function startGoogleSignIn() {
  return postJson<GoogleAuthStartResponse>('/auth/google/start')
}

export function logoutAuth() {
  return postVoid('/auth/logout')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForGoogleSignIn(): Promise<boolean> {
  const deadline = Date.now() + GOOGLE_SIGN_IN_TIMEOUT_MS
  while (Date.now() < deadline) {
    await sleep(GOOGLE_SIGN_IN_POLL_MS)
    if ((await authStatus.fetch()).status === 'authenticated') {
      return true
    }
  }
  return false
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
