import net from 'node:net'

const DEFAULT_OAUTH_LOOPBACK_START = 8085

export function findAvailablePort(
  startPort = DEFAULT_OAUTH_LOOPBACK_START,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(startPort, '127.0.0.1', () => {
      const address = server.address()
      const port =
        typeof address === 'object' && address !== null ? address.port : startPort
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve(port)
      })
    })
    server.on('error', () => {
      findAvailablePort(startPort + 1)
        .then(resolve)
        .catch(reject)
    })
  })
}

export function oauthLoopbackRedirectUri(port: number): string {
  return `http://127.0.0.1:${port}/callback`
}
