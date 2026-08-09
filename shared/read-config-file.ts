import { existsSync, readFileSync } from 'node:fs'
import type { BasebakaConfigFile } from './config.js'

export function readJsonFile(path: string): unknown | null {
  if (!existsSync(path)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown
  } catch {
    console.warn(`Ignoring invalid JSON file: ${path}`)
    return null
  }
}

export function readConfigFile(path: string): BasebakaConfigFile | null {
  const raw = readJsonFile(path)
  if (!raw || typeof raw !== 'object') {
    return null
  }
  return raw as BasebakaConfigFile
}
