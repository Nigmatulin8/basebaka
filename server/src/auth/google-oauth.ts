import { createHash, randomBytes } from 'node:crypto'
import http from 'node:http'
import type { AuthStatusResponse } from '../../../shared/auth.js'
import { oauthSetupHint, resolveGoogleOAuthConfig } from '../oauth-config.js'
import {
  findAvailablePort,
  oauthLoopbackRedirectUri,
} from './oauth-loopback.js'
import {
  clearAuthState,
  clearGoogleSession,
  clearReauthMarker,
  createStoredSession,
  readGoogleSession,
  readReauthMarker,
  writeGoogleSession,
  writeReauthMarker,
  type StoredGoogleSession,
} from './session-store.js'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

const OAUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/firebase',
  'https://www.googleapis.com/auth/cloud-platform',
].join(' ')

const PENDING_TTL_MS = 10 * 60 * 1000
const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000

type PendingOAuth = {
  codeVerifier: string | null
  redirectUri: string
  createdAt: number
}

const pendingByState = new Map<string, PendingOAuth>()
let activeLoopbackServer: http.Server | null = null
let activeSignInTimer: ReturnType<typeof setTimeout> | null = null

function closeActiveLoopbackServer() {
  if (activeSignInTimer) {
    clearTimeout(activeSignInTimer)
    activeSignInTimer = null
  }
  if (activeLoopbackServer) {
    try {
      activeLoopbackServer.close()
    } catch {
      // ignore
    }
    activeLoopbackServer = null
  }
}

function prunePending() {
  const now = Date.now()
  for (const [state, pending] of pendingByState) {
    if (now - pending.createdAt > PENDING_TTL_MS) {
      pendingByState.delete(state)
    }
  }
}

function base64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64Url(randomBytes(32))
  const codeChallenge = base64Url(
    createHash('sha256').update(codeVerifier).digest(),
  )
  return { codeVerifier, codeChallenge }
}

function misconfigured(message: string): AuthStatusResponse {
  return { status: 'misconfigured', message }
}

export const SESSION_EXPIRED_MESSAGE = 'Session expired. Sign in again.'

function reauthStatus(marker: {
  email: string
  accountId: string
  message: string
}): AuthStatusResponse {
  return {
    status: 'requiresReauth',
    email: marker.email,
    accountId: marker.accountId,
    message: marker.message,
  }
}

export async function getAuthStatus(): Promise<AuthStatusResponse> {
  const reauth = readReauthMarker()
  if (reauth) {
    return reauthStatus(reauth)
  }

  const session = readGoogleSession()
  if (!session) {
    return { status: 'unauthenticated' }
  }

  const oauth = resolveGoogleOAuthConfig()
  if (!oauth) {
    return misconfigured(oauthSetupHint())
  }

  const fresh = await ensureFreshSession()
  if (!fresh) {
    const after = readReauthMarker()
    return after ? reauthStatus(after) : { status: 'unauthenticated' }
  }

  return {
    status: 'authenticated',
    email: fresh.email,
    accountId: fresh.accountId,
  }
}

function accessTokenExpired(session: StoredGoogleSession): boolean {
  return Date.now() >= session.expiresAt - TOKEN_EXPIRY_BUFFER_MS
}

export async function ensureFreshSession(): Promise<StoredGoogleSession | null> {
  const oauth = resolveGoogleOAuthConfig()
  const session = readGoogleSession()
  if (!oauth || !session) {
    return null
  }

  if (!accessTokenExpired(session)) {
    return session
  }

  if (!session.refreshToken) {
    clearGoogleSession()
    return null
  }

  const body = new URLSearchParams({
    client_id: oauth.clientId,
    grant_type: 'refresh_token',
    refresh_token: session.refreshToken,
  })
  if (oauth.clientSecret) {
    body.set('client_secret', oauth.clientSecret)
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string
    expires_in?: number
    refresh_token?: string
    error?: string
  }

  if (tokenJson.error === 'invalid_grant') {
    clearGoogleSession()
    writeReauthMarker({
      email: session.email,
      accountId: session.accountId,
      message: SESSION_EXPIRED_MESSAGE,
    })
    return null
  }

  if (!tokenRes.ok || !tokenJson.access_token || !tokenJson.expires_in) {
    clearGoogleSession()
    return null
  }

  const next = createStoredSession({
    refreshToken: tokenJson.refresh_token ?? session.refreshToken,
    accessToken: tokenJson.access_token,
    expiresInSeconds: tokenJson.expires_in,
    email: session.email,
    accountId: session.accountId,
  })
  writeGoogleSession(next)
  return next
}

export async function startGoogleSignIn(): Promise<
  { authUrl: string } | AuthStatusResponse
> {
  const oauth = resolveGoogleOAuthConfig()
  if (!oauth) {
    return misconfigured(oauthSetupHint())
  }

  closeActiveLoopbackServer()
  prunePending()
  clearReauthMarker()

  const redirectPort = await findAvailablePort()
  const redirectUri = oauthLoopbackRedirectUri(redirectPort)

  const state = base64Url(randomBytes(24))
  const usePkce = !oauth.confidentialClient
  let codeVerifier: string | null = null

  const params = new URLSearchParams({
    client_id: oauth.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    state,
    access_type: 'offline',
    prompt: 'consent',
  })

  if (usePkce) {
    const pkce = createPkcePair()
    codeVerifier = pkce.codeVerifier
    params.set('code_challenge', pkce.codeChallenge)
    params.set('code_challenge_method', 'S256')
  }

  pendingByState.set(state, {
    codeVerifier,
    redirectUri,
    createdAt: Date.now(),
  })

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`

  await startLoopbackServer(redirectPort, state)

  return { authUrl }
}

function htmlPage(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1rem; }
    </style>
  </head>
  <body>${body}</body>
</html>`
}

async function exchangeCodeForTokens(input: {
  code: string
  codeVerifier: string | null
  redirectUri: string
}): Promise<StoredGoogleSession> {
  const oauth = resolveGoogleOAuthConfig()
  if (!oauth) {
    throw new Error(oauthSetupHint())
  }

  const body = new URLSearchParams({
    client_id: oauth.clientId,
    code: input.code,
    redirect_uri: input.redirectUri,
    grant_type: 'authorization_code',
  })
  if (input.codeVerifier) {
    body.set('code_verifier', input.codeVerifier)
  }
  if (oauth.clientSecret) {
    body.set('client_secret', oauth.clientSecret)
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!tokenRes.ok) {
    const detail = await tokenRes.text()
    throw new Error(`Token exchange failed: ${detail}`)
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string
    expires_in: number
    refresh_token?: string
  }

  if (!tokenJson.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Revoke app access in Google Account settings and try again.',
    )
  }

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })

  if (!profileRes.ok) {
    throw new Error('Failed to load Google profile')
  }

  const profile = (await profileRes.json()) as { sub: string; email?: string }

  if (!profile.sub) {
    throw new Error('Google profile is missing subject id')
  }

  const session = createStoredSession({
    refreshToken: tokenJson.refresh_token,
    accessToken: tokenJson.access_token,
    expiresInSeconds: tokenJson.expires_in,
    email: profile.email ?? '(unknown)',
    accountId: profile.sub,
  })

  writeGoogleSession(session)
  return session
}

function startLoopbackServer(
  redirectPort: number,
  expectedState: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${redirectPort}`)

      if (url.pathname !== '/callback') {
        res.writeHead(404)
        res.end()
        return
      }

      const error = url.searchParams.get('error')
      const state = url.searchParams.get('state')
      const code = url.searchParams.get('code')

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(
          htmlPage(
            'Sign-in cancelled',
            `<h1>Sign-in cancelled</h1><p>${error}</p>`,
          ),
        )
        closeActiveLoopbackServer()
        return
      }

      if (!state || !code || state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(htmlPage('Sign-in failed', '<h1>Invalid OAuth state</h1>'))
        closeActiveLoopbackServer()
        return
      }

      const pending = pendingByState.get(state)
      pendingByState.delete(state)

      if (!pending || Date.now() - pending.createdAt > PENDING_TTL_MS) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(htmlPage('Sign-in expired', '<h1>Sign-in expired</h1>'))
        closeActiveLoopbackServer()
        return
      }

      try {
        await exchangeCodeForTokens({
          code,
          codeVerifier: pending.codeVerifier,
          redirectUri: pending.redirectUri,
        })
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(
          htmlPage(
            'Signed in',
            '<h1>Signed in</h1><p>You can close this tab and return to Basebaka.</p>',
          ),
        )
      } catch (callbackError) {
        const message =
          callbackError instanceof Error ? callbackError.message : 'Unknown error'
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(
          htmlPage('Sign-in failed', `<h1>Sign-in failed</h1><p>${message}</p>`),
        )
      }

      closeActiveLoopbackServer()
    })

    activeLoopbackServer = server

    activeSignInTimer = setTimeout(() => {
      closeActiveLoopbackServer()
    }, SIGN_IN_TIMEOUT_MS)

    server.listen(redirectPort, '127.0.0.1', () => resolve())
    server.on('error', (err) => {
      closeActiveLoopbackServer()
      reject(err)
    })
  })
}

export function logoutGoogle(): void {
  closeActiveLoopbackServer()
  pendingByState.clear()
  clearAuthState()
}
