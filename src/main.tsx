import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DocumentLanguage } from '@/components/DocumentLanguage.tsx'
import { i18nReady } from '@/lib/i18n.ts'
import { StartupGate } from '@/screens/StartupGate'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from '@/router/AppRouter.tsx'

const queryClient = new QueryClient()

void i18nReady.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DocumentLanguage />
      <StartupGate>
        <QueryClientProvider client={queryClient}>
          <AppRouter />
        </QueryClientProvider>
      </StartupGate>
    </StrictMode>,
  )
})
