import type {
  AuthStatusResponse,
  GoogleAuthStartResponse,
  HealthResponse,
} from '../../../shared/auth.js'
import { sendJson } from '../http.js'
import { get, post } from '../router.js'
import {
  getAuthStatus,
  logoutGoogle,
  startGoogleSignIn,
} from './google-oauth.js'

const SIDECAR_VERSION = '0.2.4'

get('/health', (_req, res) => {
  sendJson(res, 200, {
    ok: true,
    sidecarVersion: SIDECAR_VERSION,
    features: ['auth', 'projects'],
  } satisfies HealthResponse)
})

get('/auth/status', async (_req, res) => {
  sendJson(res, 200, await getAuthStatus())
})

post('/auth/google/start', async (_req, res) => {
  const result = await startGoogleSignIn()
  if ('authUrl' in result) {
    sendJson(res, 200, {
      authUrl: result.authUrl,
    } satisfies GoogleAuthStartResponse)
    return
  }
  sendJson(res, 503, result satisfies AuthStatusResponse)
})

post('/auth/logout', (_req, res) => {
  logoutGoogle()
  sendJson(res, 200, { ok: true })
})
