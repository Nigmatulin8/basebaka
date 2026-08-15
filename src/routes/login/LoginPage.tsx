import { Braces } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/components/auth/styles.scss'
import {
  authQueryKeys,
  startGoogleSignIn,
  useAuthStatus,
  waitForGoogleSignIn,
} from '@/lib/auth-api.ts'
import {
  openExternalUrl,
  preOpenExternalBrowserTab,
} from '@/lib/open-external-url.ts'
import { useServerPort } from '@/lib/server-port-context.tsx'
import basebakaIcon from '@assets/icon.png'
import googleIcon from '@assets/icons/google.svg'

export function LoginPage() {
  const { t } = useTranslation()
  const port = useServerPort()
  const router = useRouter()
  const queryClient = useQueryClient()
  const authQuery = useAuthStatus()

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setError(null)
    setPending(true)
    try {
      const browserTab = preOpenExternalBrowserTab()
      const { authUrl } = await startGoogleSignIn(port)
      await openExternalUrl(authUrl, { preOpenedWindow: browserTab })

      if (await waitForGoogleSignIn(port)) {
        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.status(port),
        })
        await router.navigate({ to: '/' })
        return
      }
      setError(t('login.timeout'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.signInFailed'))
    } finally {
      setPending(false)
    }
  }

  const misconfigured =
    authQuery.data?.status === 'misconfigured' ? authQuery.data.message : null

  const busy = pending || authQuery.isLoading

  return (
    <div className="login-screen fixed inset-0 z-10 flex items-center justify-center bg-base px-4">
      <div className="login-card w-85 rounded-xl border border-line bg-surface px-7 py-8 text-center">
        <div className="login-mark mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-accent-soft">
          <img
            src={basebakaIcon}
            alt=""
            className="size-5.5 rounded-sm"
          />
        </div>

        <h1 className="login-title mb-1.5 font-mono text-base text-ink">
          Basebaka
        </h1>
        <p className="login-sub mb-6 text-xs leading-relaxed text-ink-soft">
          {t('login.lead')}
        </p>

        {authQuery.isLoading && (
          <p className="mb-4 text-[11px] text-ink-muted">
            {t('login.checking')}
          </p>
        )}

        {authQuery.error && (
          <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-left text-xs text-danger">
            {t('login.sidecarError')}
          </p>
        )}

        {misconfigured && (
          <pre className="mb-4 overflow-x-auto rounded-lg bg-danger-soft px-3 py-2 text-left font-mono text-xs whitespace-pre-wrap text-danger">
            {misconfigured}
          </pre>
        )}

        {error && (
          <pre className="mb-4 overflow-x-auto rounded-lg bg-danger-soft px-3 py-2 text-left font-mono text-xs whitespace-pre-wrap text-danger">
            {error}
          </pre>
        )}

        <button
          type="button"
          className="google-btn flex w-full items-center justify-center gap-2.5 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          onClick={() => void handleSignIn()}
        >
          <img src={googleIcon} alt="" className="size-4.5" />
          {pending ? t('login.signingIn') : t('login.signInGoogle')}
        </button>

        {pending && (
          <p className="mt-3 text-sm text-ink-muted">
            {t('login.waitingBrowser')}
          </p>
        )}

        <div className="login-divider my-4.5 flex items-center gap-2.5">
          <span className="h-px flex-1 bg-line" />
          <span className="text-sm text-ink-muted">{t('login.or')}</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          className="login-alt cursor-pointer flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface2 px-3 py-2.5 text-left transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          onClick={() => setError(t('login.serviceAccountSoon'))}
        >
          <Braces className="shrink-0 text-accent" aria-hidden size={18}/>
          <span className="min-w-0">
            <span className="block font-mono text-xs text-ink">
              {t('login.serviceAccountTitle')}
            </span>
            <span className="mt-0.5 block text-xs text-ink-muted">
              {t('login.serviceAccountLead')}
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
