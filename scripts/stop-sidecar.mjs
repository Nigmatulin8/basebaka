/**
 * Stops running Basebaka sidecar / debug app processes.
 */
import { execFileSync } from 'node:child_process'

if (process.platform === 'win32') {
  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      "Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'basabaka-server*' -or $_.Name -eq 'app' } | Stop-Process -Force",
    ],
    { stdio: 'inherit' },
  )
  process.exit(0)
}

try {
  execFileSync('pkill', ['-f', 'basabaka-server'], { stdio: 'ignore' })
} catch {
  // no matching process
}

try {
  // Tauri debug binary is often named `app` / `basebaka`
  execFileSync('pkill', ['-f', '/src-tauri/target/debug/app'], {
    stdio: 'ignore',
  })
} catch {
  // no matching process
}

console.log('Stopped sidecar-related processes (if any were running).')
