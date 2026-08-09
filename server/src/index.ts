import http from 'node:http'
import { URL } from 'node:url'
import { handleAuthRoute } from './auth/routes.js'
import { SERVER_HOST } from '../../shared/config.js'
import { resolveServerPort } from './config.js'
import { sendJson, sendOptions } from './http.js'
import { loadSidecarEnvFiles } from './load-env.js'

loadSidecarEnvFiles()

const PORT = resolveServerPort()

if (!process.stdout.isTTY) {
  const handle = (
    process.stdout as NodeJS.WriteStream & {
      _handle?: { setBlocking?: (blocking: boolean) => void }
    }
  )._handle
  handle?.setBlocking?.(true)
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendOptions(res)
    return
  }

  const url = new URL(req.url ?? '/', `http://${SERVER_HOST}:${PORT}`)
  if (await handleAuthRoute(req, res, url.pathname)) {
    return
  }
  sendJson(res, 404, { ok: false, error: 'Not found' })
})

server.listen(PORT, SERVER_HOST, () => {
  console.log(`Server started on http://${SERVER_HOST}:${PORT}`)
})
