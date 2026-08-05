import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CONFIG_FILE_NAME,
  DEFAULT_SERVER_PORT,
  LOCAL_CONFIG_FILE_NAME,
  SERVER_PORT_ENV,
  type BasebakaConfigFile,
} from '../../shared/config.js'

function parsePort(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return null
  }
  return n
}

function readPortFromFile(path: string): number | null {
  if (!existsSync(path)) {
    return null
  }

  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as BasebakaConfigFile
    return parsePort(raw.serverPort)
  } catch {
    console.warn(`Ignoring invalid config file: ${path}`)
    return null
  }
}

function configSearchRoots(): string[] {
  const roots: string[] = []
  const seen = new Set<string>()

  const push = (dir: string) => {
    if (seen.has(dir)) {
      return
    }
    seen.add(dir)
    roots.push(dir)
  }

  push(process.cwd())

  // server/src → repo root (and intermediates)
  let dir = dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 6; i += 1) {
    push(dir)
    const parent = dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }

  return roots
}

/**
 * Resolve listen port: env → local config → defaults config → 3001.
 */
export function resolveServerPort(): number {
  const fromEnv = parsePort(process.env[SERVER_PORT_ENV])
  if (fromEnv != null) {
    return fromEnv
  }

  for (const root of configSearchRoots()) {
    const localPort = readPortFromFile(join(root, LOCAL_CONFIG_FILE_NAME))
    if (localPort != null) {
      return localPort
    }
  }

  for (const root of configSearchRoots()) {
    const port = readPortFromFile(join(root, CONFIG_FILE_NAME))
    if (port != null) {
      return port
    }
  }

  return DEFAULT_SERVER_PORT
}
