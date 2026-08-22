import type { IncomingMessage, ServerResponse } from 'node:http'
import { ensureFreshSession } from './auth/google-oauth.js'
import type { StoredGoogleSession } from './auth/session-store.js'
import { sendJson } from './http.js'

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
) => void | Promise<void>

const routes: Array<{ method: string; path: string; handler: Handler }> = []

export function get(path: string, handler: Handler) {
  routes.push({ method: 'GET', path, handler })
}

export function post(path: string, handler: Handler) {
  routes.push({ method: 'POST', path, handler })
}

export async function dispatch(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): Promise<boolean> {
  const route = routes.find(
    (entry) => entry.method === req.method && entry.path === pathname,
  )
  if (!route) {
    return false
  }
  await route.handler(req, res)
  return true
}

export async function requireSession(
  res: ServerResponse,
): Promise<StoredGoogleSession | null> {
  const session = await ensureFreshSession()
  if (!session) {
    sendJson(res, 401, { message: 'Sign in required' })
    return null
  }
  return session
}
