import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  credentialsLookValid,
  loadGoogleOAuthCredentials,
} from './lib/google-oauth-credentials.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const userFile = join(homedir(), '.basebaka', 'google-oauth.json')

const { clientId, clientSecret } = loadGoogleOAuthCredentials(root)

if (!credentialsLookValid(clientId)) {
  console.error('No Google OAuth credentials found.')
  console.error(
    `Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to ${join(root, '.env')} (Desktop client in GCP).`,
  )
  console.error(`Or edit ${userFile} — see google-oauth.example.json`)
  process.exit(1)
}

mkdirSync(dirname(userFile), { recursive: true })
writeFileSync(
  userFile,
  `${JSON.stringify({ clientId, ...(clientSecret ? { clientSecret } : {}) }, null, 2)}\n`,
  { mode: 0o600 },
)

console.log(`Wrote ${userFile}`)
console.log('Next: pnpm build:sidecar && pnpm tauri dev')
