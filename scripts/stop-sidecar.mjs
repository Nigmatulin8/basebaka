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
} else {
  for (const pattern of ['basabaka-server', '/src-tauri/target/debug/app']) {
    try {
      execFileSync('pkill', ['-f', pattern], { stdio: 'ignore' })
    } catch {
      // no matching process
    }
  }
}
