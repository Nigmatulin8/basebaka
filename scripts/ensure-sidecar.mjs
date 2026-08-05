/**
 * Ensures the Tauri sidecar exists for the current host platform.
 * If missing, runs `pnpm build:sidecar`.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const binariesDir = join(root, 'src-tauri/binaries')

/** @type {Record<string, { triple: string; ext: string }>} */
const platformTargets = {
  'win32-x64': { triple: 'x86_64-pc-windows-msvc', ext: '.exe' },
  'darwin-arm64': { triple: 'aarch64-apple-darwin', ext: '' },
  'darwin-x64': { triple: 'x86_64-apple-darwin', ext: '' },
  'linux-x64': { triple: 'x86_64-unknown-linux-gnu', ext: '' },
}

const platformKey = `${process.platform}-${process.arch}`
const target = platformTargets[platformKey]

if (!target) {
  console.error(`Unsupported host for sidecar: ${platformKey}`)
  process.exit(1)
}

const outputPath = join(
  binariesDir,
  `basabaka-server-${target.triple}${target.ext}`,
)

if (existsSync(outputPath)) {
  process.exit(0)
}

console.log(`Sidecar missing for ${platformKey}:`)
console.log(`  ${outputPath}`)
console.log('Building with `pnpm build:sidecar`…')

try {
  execFileSync('pnpm', ['build:sidecar'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
} catch {
  console.error('\nFailed to build sidecar. Run `pnpm build:sidecar` manually.')
  process.exit(1)
}

if (!existsSync(outputPath)) {
  console.error(`Sidecar still missing after build: ${outputPath}`)
  process.exit(1)
}
