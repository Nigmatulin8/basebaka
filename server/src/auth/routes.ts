import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  AuthStatusResponse,
  GoogleAuthStartResponse,
  HealthResponse,
} from '../../../shared/auth.js'
import { sendJson } from '../http.js'
import { getAuthStatus, logoutGoogle, startGoogleSignIn } from './google-oauth.js'

const SIDECAR_VERSION = '0.2.3'

export async function handleAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): Promise<boolean> {
  if (pathname === '/health' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      sidecarVersion: SIDECAR_VERSION,
      features: ['auth'],
    } satisfies HealthResponse)
    return true
  }

  if (pathname === '/auth/status' && req.method === 'GET') {
    sendJson(res, 200, await getAuthStatus())
    return true
  }

  if (pathname === '/auth/google/start' && req.method === 'POST') {
    const result = await startGoogleSignIn()
    if ('authUrl' in result) {
      sendJson(res, 200, { authUrl: result.authUrl } satisfies GoogleAuthStartResponse)
      return true
    }
    sendJson(res, 503, result satisfies AuthStatusResponse)
    return true
  }

  if (pathname === '/auth/logout' && req.method === 'POST') {
    logoutGoogle()
    sendJson(res, 200, { ok: true })
    return true
  }

  return false
}
