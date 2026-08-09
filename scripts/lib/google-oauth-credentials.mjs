import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {}
  }
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const eq = trimmed.indexOf('=')
    if (eq <= 0) {
      continue
    }
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

export function readJson(path) {
  if (!existsSync(path)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

export function loadGoogleOAuthCredentials(root) {
  const env = {
    ...parseEnvFile(join(root, '.env')),
    ...parseEnvFile(join(homedir(), '.basebaka', '.env')),
  }
  const local = readJson(join(root, 'basebaka.config.local.json')) ?? {}
  const userOAuth = readJson(join(homedir(), '.basebaka', 'google-oauth.json')) ?? {}

  const clientId =
    env.GOOGLE_OAUTH_CLIENT_ID ||
    env.GOOGLE_CLIENT_ID ||
    local.googleOAuthClientId ||
    userOAuth.clientId ||
    userOAuth.googleOAuthClientId

  const clientSecret =
    env.GOOGLE_OAUTH_CLIENT_SECRET ||
    env.GOOGLE_CLIENT_SECRET ||
    local.googleOAuthClientSecret ||
    userOAuth.clientSecret ||
    userOAuth.googleOAuthClientSecret

  return { clientId, clientSecret }
}

export function credentialsLookValid(clientId) {
  if (!clientId) {
    return false
  }
  const id = String(clientId)
  return !id.includes('YOUR_') && !id.includes('your-client')
}
