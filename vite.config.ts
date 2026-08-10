import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { readFileSync } from 'node:fs'
import { DEFAULT_SERVER_PORT } from './shared/config.ts'

function resolveDevSidecarPort(): number {
  const fromEnv = Number(process.env.BASEBAKA_SERVER_PORT)
  if (Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv <= 65535) {
    return fromEnv
  }

  try {
    const raw = JSON.parse(readFileSync('basebaka.config.json', 'utf8')) as {
      serverPort?: number
    }
    const port = raw.serverPort
    if (typeof port === 'number' && port > 0 && port <= 65535) {
      return port
    }
  } catch {
    // no config file
  }

  return DEFAULT_SERVER_PORT
}

const sidecarPort = resolveDevSidecarPort()

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  server: {
    proxy: {
      '/sidecar': {
        target: `http://127.0.0.1:${sidecarPort}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sidecar/, ''),
      },
    },
  },
})
