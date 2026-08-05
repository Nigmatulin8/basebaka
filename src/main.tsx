import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import { DocumentLanguage } from './components/DocumentLanguage.tsx'
import { i18nReady } from './lib/i18n.ts'
import { StartupGate } from './screens/StartupGate'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

void i18nReady.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DocumentLanguage />
      <StartupGate>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StartupGate>
    </StrictMode>,
  )
})
