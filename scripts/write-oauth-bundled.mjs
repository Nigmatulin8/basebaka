import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  credentialsLookValid,
  loadGoogleOAuthCredentials,
} from './lib/google-oauth-credentials.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { clientId, clientSecret } = loadGoogleOAuthCredentials(root)

if (!credentialsLookValid(clientId)) {
  console.log('write-oauth-bundled: no Google OAuth credentials — skip')
  process.exit(0)
}

const bundled = {
  googleOAuthClientId: clientId,
  ...(clientSecret && !String(clientSecret).includes('YOUR_')
    ? { googleOAuthClientSecret: clientSecret }
    : {}),
}

const outPath = join(root, 'server', 'oauth-bundled.json')
writeFileSync(outPath, `${JSON.stringify(bundled, null, 2)}\n`, 'utf8')
console.log(`write-oauth-bundled: wrote ${outPath}`)
