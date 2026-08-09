import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASEBAKA_CONFIG_DIR_ENV } from './config.js'

export function configSearchRoots(): string[] {
  const roots: string[] = []
  const seen = new Set<string>()

  const push = (dir: string) => {
    if (!dir || seen.has(dir)) {
      return
    }
    seen.add(dir)
    roots.push(dir)
  }

  const configDir = process.env[BASEBAKA_CONFIG_DIR_ENV]?.trim()
  if (configDir) {
    push(configDir)
  }

  push(process.cwd())

  let dir = dirname(process.execPath)
  for (let i = 0; i < 10; i += 1) {
    push(dir)
    const parent = dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }

  dir = dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 8; i += 1) {
    push(dir)
    const parent = dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }

  return roots
}
