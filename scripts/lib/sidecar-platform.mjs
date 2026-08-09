import { join } from 'node:path'

/** @type {Record<string, { pkg: string; triple: string; ext: string }>} */
export const platformTargets = {
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

export function resolveSidecarTarget() {
  const platformKey = `${process.platform}-${process.arch}`
  const target = platformTargets[platformKey]
  if (!target) {
    return { platformKey, target: null }
  }
  return { platformKey, target }
}

export function sidecarBinaryPath(root, target) {
  return join(
    root,
    'src-tauri/binaries',
    `basabaka-server-${target.triple}${target.ext}`,
  )
}
