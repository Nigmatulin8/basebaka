import { DEFAULT_SERVER_PORT, SERVER_HOST } from '../../shared/config.ts'

export async function sidecarFetch(
  port: number,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = import.meta.env.DEV
    ? '/sidecar'
    : `http://${SERVER_HOST}:${port}`
  return fetch(`${base}${path}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(30_000),
  })
}

export async function readSidecarErrorMessage(
  res: Response,
): Promise<string | null> {
  const body = await res.json().catch(() => null)
  if (body && typeof body === 'object' && 'message' in body) {
    return String((body as { message: string }).message)
  }
  return null
}

export const defaultSidecarPort = DEFAULT_SERVER_PORT
