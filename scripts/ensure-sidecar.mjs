import { existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  resolveSidecarTarget,
  sidecarBinaryPath,
} from './lib/sidecar-platform.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { platformKey, target } = resolveSidecarTarget()

if (!target) {
  console.error(`Unsupported host for sidecar: ${platformKey}`)
  process.exit(1)
}

const outputPath = sidecarBinaryPath(root, target)
const serverEntry = join(root, 'server/dist/server/src/index.js')

function sidecarIsStale() {
  if (!existsSync(outputPath) || !existsSync(serverEntry)) {
    return true
  }
  return statSync(serverEntry).mtimeMs > statSync(outputPath).mtimeMs
}

if (existsSync(outputPath) && !sidecarIsStale()) {
  process.exit(0)
}

console.log(
  existsSync(outputPath)
    ? 'Sidecar stale — rebuilding…'
    : `Sidecar missing (${platformKey})`,
)

try {
  execFileSync('pnpm', ['build:sidecar'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
} catch {
  console.error('Failed to build sidecar. Run `pnpm build:sidecar` manually.')
  process.exit(1)
}

if (!existsSync(outputPath)) {
  console.error(`Sidecar still missing: ${outputPath}`)
  process.exit(1)
}
