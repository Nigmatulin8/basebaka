export type AuthStatusResponse =
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; email: string; accountId: string }
  | {
      status: 'requiresReauth'
      email: string
      accountId: string
      message: string
    }
  | { status: 'misconfigured'; message: string }

export type GoogleAuthStartResponse = {
  authUrl: string
}

export type HealthResponse = {
  ok: true
  sidecarVersion: string
  features: string[]
}
