import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { configSearchRoots } from '../../shared/config-roots.js'

const ENV_FILE_NAME = '.env'

function applyEnvLine(line: string): void {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) {
    return
  }

  const equals = trimmed.indexOf('=')
  if (equals <= 0) {
    return
  }

  const key = trimmed.slice(0, equals).trim()
  if (!key || process.env[key] !== undefined) {
    return
  }

  let value = trimmed.slice(equals + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  process.env[key] = value
}

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return
  }

  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      applyEnvLine(line)
    }
    console.log(`Loaded env from ${path}`)
  } catch (error) {
    console.warn(
      `Failed to load ${path}:`,
      error instanceof Error ? error.message : error,
    )
  }
}

let loaded = false

export function loadSidecarEnvFiles(): void {
  if (loaded) {
    return
  }
  loaded = true

  for (const root of configSearchRoots()) {
    loadEnvFile(join(root, ENV_FILE_NAME))
  }

  loadEnvFile(join(homedir(), '.basebaka', ENV_FILE_NAME))
}
