import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../../components/auth/styles.scss'
import {
  authQueryKeys,
  startGoogleSignIn,
  useAuthStatus,
  waitForGoogleSignIn,
} from '../../lib/auth-api.ts'
import { openExternalUrl, preOpenExternalBrowserTab } from '../../lib/open-external-url.ts'
import { useServerPort } from '../../lib/server-port-context.tsx'

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
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.status(port) })
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

  return (
    <div className="login-screen">
      <div className="login-screen__card">
        <h1 className="login-screen__title">{t('login.title')}</h1>
        <p className="login-screen__lead">{t('login.lead')}</p>

        {authQuery.isLoading && (
          <p className="login-screen__muted">{t('login.checking')}</p>
        )}

        {authQuery.error && (
          <p className="login-screen__error">{t('login.sidecarError')}</p>
        )}

        {misconfigured && (
          <pre className="login-screen__error login-screen__error--block">{misconfigured}</pre>
        )}

        {error && <pre className="login-screen__error login-screen__error--block">{error}</pre>}

        <button
          type="button"
          className="login-screen__btn"
          disabled={pending || authQuery.isLoading}
          onClick={() => void handleSignIn()}
        >
          {pending ? t('login.signingIn') : t('login.signInGoogle')}
        </button>

        {pending && (
          <p className="login-screen__muted">{t('login.waitingBrowser')}</p>
        )}
      </div>
    </div>
  )
}
