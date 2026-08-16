import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_SERVER_PORT } from './shared/config.ts'
import tailwindcss from '@tailwindcss/vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

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
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@assets': path.join(rootDir, 'src/assets'),
      '@shared': path.join(rootDir, 'shared'),
      '@ui': path.join(rootDir, 'src/components/ui'),
      '@': path.join(rootDir, 'src'),
    },
  },
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
