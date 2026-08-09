import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SESSION_VERSION = 1 as const

export type StoredGoogleSession = {
  version: typeof SESSION_VERSION
  refreshToken: string
  accessToken: string
  expiresAt: number
  email: string
  accountId: string
}

function sessionDir(): string {
  return join(homedir(), '.basebaka')
}

function sessionPath(): string {
  return join(sessionDir(), 'google-auth-session.json')
}

export function readGoogleSession(): StoredGoogleSession | null {
  const path = sessionPath()
  if (!existsSync(path)) {
    return null
  }

  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as StoredGoogleSession
    if (raw.version !== SESSION_VERSION) {
      return null
    }
    if (
      typeof raw.refreshToken !== 'string' ||
      typeof raw.accessToken !== 'string' ||
      typeof raw.expiresAt !== 'number' ||
      typeof raw.email !== 'string' ||
      typeof raw.accountId !== 'string'
    ) {
      return null
    }
    return raw
  } catch {
    return null
  }
}

function reauthPath(): string {
  return join(sessionDir(), 'google-reauth-required.json')
}

export type ReauthMarker = {
  email: string
  accountId: string
  message: string
}

export function readReauthMarker(): ReauthMarker | null {
  const path = reauthPath()
  if (!existsSync(path)) {
    return null
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as ReauthMarker
    if (typeof raw.email === 'string' && typeof raw.accountId === 'string') {
      return raw
    }
    return null
  } catch {
    return null
  }
}

export function writeReauthMarker(marker: ReauthMarker): void {
  mkdirSync(sessionDir(), { recursive: true })
  const path = reauthPath()
  writeFileSync(path, `${JSON.stringify(marker, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
}

export function clearReauthMarker(): void {
  const path = reauthPath()
  if (existsSync(path)) {
    unlinkSync(path)
  }
}

export function writeGoogleSession(session: StoredGoogleSession): void {
  clearReauthMarker()
  const dir = sessionDir()
  mkdirSync(dir, { recursive: true })

  const path = sessionPath()
  const tempPath = `${path}.tmp`
  writeFileSync(tempPath, `${JSON.stringify(session, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
  renameSync(tempPath, path)
}

export function clearGoogleSession(): void {
  const path = sessionPath()
  if (existsSync(path)) {
    unlinkSync(path)
  }
}

export function clearAuthState(): void {
  clearGoogleSession()
  clearReauthMarker()
}

export function createStoredSession(input: {
  refreshToken: string
  accessToken: string
  expiresInSeconds: number
  email: string
  accountId: string
}): StoredGoogleSession {
  const skewMs = 60_000
  return {
    version: SESSION_VERSION,
    refreshToken: input.refreshToken,
    accessToken: input.accessToken,
    expiresAt: Date.now() + input.expiresInSeconds * 1000 - skewMs,
    email: input.email,
    accountId: input.accountId,
  }
}
