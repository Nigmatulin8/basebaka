/**
 * Builds the Tauri sidecar executable from the compiled Node server.
 *
 * Flow: pnpm build:server → pkg → src-tauri/binaries/basabaka-server-<target-triple>[.exe]
 *
 * Override pkg target: set SIDECAR_PKG_TARGET (e.g. node22-win-x64).
 * Default Node 22 targets match prebuilt binaries on pkg-fetch v3.6 (Node 20 assets are not published).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = join(root, 'server')
const entry = join(serverDir, 'dist/server/src/index.js')
const binariesDir = join(root, 'src-tauri/binaries')

/** @type {Record<string, { pkg: string; triple: string; ext: string }>} */
const platformTargets = {
  'win32-x64': {
    pkg: 'node22-win-x64',
    triple: 'x86_64-pc-windows-msvc',
    ext: '.exe',
  },
  'darwin-arm64': {
    pkg: 'node22-macos-arm64',
    triple: 'aarch64-apple-darwin',
    ext: '',
  },
  'darwin-x64': {
    pkg: 'node22-macos-x64',
    triple: 'x86_64-apple-darwin',
    ext: '',
  },
  'linux-x64': {
    pkg: 'node22-linux-x64',
    triple: 'x86_64-unknown-linux-gnu',
    ext: '',
  },
}

const platformKey = `${process.platform}-${process.arch}`
const target = platformTargets[platformKey]

if (!target) {
  console.error(`Unsupported host for sidecar build: ${platformKey}`)
  process.exit(1)
}

if (!existsSync(entry)) {
  console.error(`Server entry not found: ${entry}`)
  console.error('Run `pnpm build:server` first.')
  process.exit(1)
}

mkdirSync(binariesDir, { recursive: true })

const pkgTarget = process.env.SIDECAR_PKG_TARGET ?? target.pkg
const outputBase = join(
  binariesDir,
  `basabaka-server-${target.triple}${target.ext}`,
)

// Build into a staging name first so pkg does not unlink a running sidecar exe.
const stagingBase = join(
  binariesDir,
  `.basabaka-server-${target.triple}.build${target.ext}`,
)
const stagingPkgOutput =
  process.platform === 'win32'
    ? join(binariesDir, `.basabaka-server-${target.triple}.build`)
    : stagingBase

function printSidecarLockedHelp(lockedPath) {
  console.error(`\nCannot replace ${lockedPath} — file is in use (EPERM).`)
  console.error(
    'Close Basebaka / stop `pnpm tauri dev`, then run `pnpm stop:sidecar` and retry.',
  )
  console.error(
    'PowerShell: Get-Process basabaka-server*, app -ErrorAction SilentlyContinue | Stop-Process -Force',
  )
}

function promoteStagingToRelease() {
  if (!existsSync(stagingBase)) {
    console.error(`Staging binary missing: ${stagingBase}`)
    process.exit(1)
  }

  try {
    if (existsSync(outputBase)) {
      unlinkSync(outputBase)
    }
    renameSync(stagingBase, outputBase)
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'EPERM'
    ) {
      printSidecarLockedHelp(outputBase)
      console.error(`New build kept at: ${stagingBase}`)
      process.exit(1)
    }
    throw error
  }
}

/**
 * pkg-fetch builds Node from source when prebuilts are missing; that needs `patch` on PATH.
 * Git for Windows ships patch.exe but often does not add usr\bin to the user PATH.
 */
function envWithPkgTools() {
  const env = { ...process.env }

  if (process.platform !== 'win32') {
    return env
  }

  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path')
  const currentPath = pathKey ? env[pathKey] : ''
  const segments = currentPath.split(';').filter(Boolean)
  const seen = new Set(segments.map((s) => s.toLowerCase()))

  const gitUsrBinCandidates = [
    join(process.env.ProgramFiles ?? '', 'Git', 'usr', 'bin'),
    join(process.env['ProgramFiles(x86)'] ?? '', 'Git', 'usr', 'bin'),
    join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Git', 'usr', 'bin'),
  ]

  for (const dir of gitUsrBinCandidates) {
    if (!dir || !existsSync(join(dir, 'patch.exe'))) {
      continue
    }
    if (!seen.has(dir.toLowerCase())) {
      segments.unshift(dir)
      seen.add(dir.toLowerCase())
    }
  }

  if (pathKey) {
    env[pathKey] = segments.join(';')
  } else {
    env.PATH = segments.join(';')
  }

  return env
}

if (existsSync(stagingBase)) {
  try {
    unlinkSync(stagingBase)
  } catch {
    // ignore stale staging
  }
}

console.log(`Building sidecar (${pkgTarget}) → ${outputBase}`)

try {
  execFileSync(
    'pnpm',
    [
      'exec',
      'pkg',
      'dist/server/src/index.js',
      '--targets',
      pkgTarget,
      '--output',
      stagingPkgOutput,
    ],
    {
      cwd: serverDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: envWithPkgTools(),
    },
  )
} catch (error) {
  console.error('\nSidecar build failed.')
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    String(error.message).includes('EPERM')
  ) {
    printSidecarLockedHelp(stagingBase)
  } else if (process.platform === 'win32') {
    console.error(
      'On build-from-source, pkg needs patch.exe (Git for Windows) or PKG_CACHE_PATH.',
    )
  }
  process.exit(1)
}

promoteStagingToRelease()

console.log(`Sidecar ready: ${outputBase}`)
