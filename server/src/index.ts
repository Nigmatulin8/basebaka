import http from 'node:http'
import { SERVER_HOST } from '../../shared/config.js'
import { resolveServerPort } from './config.js'

const PORT = resolveServerPort()

/** Without a TTY (Tauri sidecar pipes stdout), Node block-buffers console.log. */
function configurePipedStdout() {
  if (process.stdout.isTTY) {
    return
  }

  const handle = (
    process.stdout as NodeJS.WriteStream & {
      _handle?: { setBlocking?: (blocking: boolean) => void }
    }
  )._handle

  handle?.setBlocking?.(true)
}

configurePipedStdout()

const server = http.createServer((_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
  })

  res.end(
    JSON.stringify({
      ok: true,
      message: 'Hello from Basebaka server',
    }),
  )
})

server.listen(PORT, SERVER_HOST, () => {
  console.log(`Server started on http://${SERVER_HOST}:${PORT}`)
})
