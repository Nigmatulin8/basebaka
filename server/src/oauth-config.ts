import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  CONFIG_FILE_NAME,
  GOOGLE_CLIENT_ID_ENV,
  GOOGLE_CLIENT_SECRET_ENV,
  GOOGLE_OAUTH_CLIENT_ID_ENV,
  GOOGLE_OAUTH_CLIENT_SECRET_ENV,
  LOCAL_CONFIG_FILE_NAME,
  type BasebakaConfigFile,
} from '../../shared/config.js'
import { configSearchRoots } from '../../shared/config-roots.js'
import { readConfigFile, readJsonFile } from '../../shared/read-config-file.js'

export type GoogleOAuthConfig = {
  clientId: string
  clientSecret: string | null
  confidentialClient: boolean
}

const USER_OAUTH_FILE = join(homedir(), '.basebaka', 'google-oauth.json')
const BUNDLED_OAUTH_FILE_NAME = 'oauth-bundled.json'

export function oauthSetupHint(): string {
  return (
    'Google Sign-In is not configured for this app. Create an OAuth 2.0 Client ID ' +
    '(Application type: Desktop) in Google Cloud Console, then add credentials via one of:\n' +
    `• ${USER_OAUTH_FILE}\n` +
    '  { "clientId": "….apps.googleusercontent.com", "clientSecret": "…" }\n' +
    '• `.env` in the project root: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET\n' +
    '• `basebaka.config.local.json` (see basebaka.config.local.example.json)\n' +
    'After adding credentials, run `pnpm build:sidecar` and restart the app.'
  )
}

function readUserOAuthFile(): BasebakaConfigFile | null {
  const raw = readJsonFile(USER_OAUTH_FILE) as {
    clientId?: string
    clientSecret?: string
    googleOAuthClientId?: string
    googleOAuthClientSecret?: string
  } | null
  if (!raw) {
    return null
  }
  return {
    googleOAuthClientId: raw.clientId ?? raw.googleOAuthClientId,
    googleOAuthClientSecret: raw.clientSecret ?? raw.googleOAuthClientSecret,
  }
}

function mergedConfig(): BasebakaConfigFile {
  let merged: BasebakaConfigFile = {}
  const userOAuth = readUserOAuthFile()
  if (userOAuth) {
    merged = { ...merged, ...userOAuth }
  }

  const tiers = [BUNDLED_OAUTH_FILE_NAME, CONFIG_FILE_NAME, LOCAL_CONFIG_FILE_NAME]
  for (const name of tiers) {
    for (const root of configSearchRoots()) {
      const file = readConfigFile(join(root, name))
      if (file) {
        merged = { ...merged, ...file }
      }
    }
  }

  return merged
}

function envClientId(): string | null {
  for (const key of [GOOGLE_OAUTH_CLIENT_ID_ENV, GOOGLE_CLIENT_ID_ENV] as const) {
    const value = process.env[key]?.trim()
    if (value && value !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      return value
    }
  }
  return null
}

function envClientSecret(): string | null {
  for (const key of [GOOGLE_OAUTH_CLIENT_SECRET_ENV, GOOGLE_CLIENT_SECRET_ENV] as const) {
    const value = process.env[key]?.trim()
    if (value && value !== 'YOUR_GOOGLE_CLIENT_SECRET_HERE') {
      return value
    }
  }
  return null
}

function configFromFiles(): GoogleOAuthConfig | null {
  const file = mergedConfig()
  const clientId = file.googleOAuthClientId?.trim()
  if (!clientId || clientId.startsWith('YOUR_')) {
    return null
  }

  const secret = file.googleOAuthClientSecret?.trim() || null
  return {
    clientId,
    clientSecret: secret && !secret.startsWith('YOUR_') ? secret : null,
    confidentialClient: Boolean(secret && !secret.startsWith('YOUR_')),
  }
}

export function resolveGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const fromEnvId = envClientId()
  if (fromEnvId) {
    const secret = envClientSecret() || null
    return {
      clientId: fromEnvId,
      clientSecret: secret,
      confidentialClient: Boolean(secret),
    }
  }
  return configFromFiles()
}
