import { join } from 'node:path'
import {
  CONFIG_FILE_NAME,
  DEFAULT_SERVER_PORT,
  LOCAL_CONFIG_FILE_NAME,
  SERVER_PORT_ENV,
} from '../../shared/config.js'
import { configSearchRoots } from '../../shared/config-roots.js'
import { readConfigFile } from '../../shared/read-config-file.js'

function parsePort(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return null
  }
  return n
}

export function resolveServerPort(): number {
  const fromEnv = parsePort(process.env[SERVER_PORT_ENV])
  if (fromEnv != null) {
    return fromEnv
  }

  for (const root of configSearchRoots()) {
    for (const name of [LOCAL_CONFIG_FILE_NAME, CONFIG_FILE_NAME]) {
      const port = parsePort(readConfigFile(join(root, name))?.serverPort)
      if (port != null) {
        return port
      }
    }
  }

  return DEFAULT_SERVER_PORT
}
