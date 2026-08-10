import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { authQueryKeys, logoutAuth, useAuthStatus } from '../../lib/auth-api.ts'
import { useServerPort } from '../../lib/server-port-context.tsx'

export function AppHeader() {
  const { t } = useTranslation()
  const port = useServerPort()
  const router = useRouter()
  const queryClient = useQueryClient()
  const authQuery = useAuthStatus()

  const logoutMutation = useMutation({
    mutationFn: () => logoutAuth(port),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.status(port),
      })
      await router.navigate({ to: '/login' })
    },
  })

  const auth = authQuery.data
  const email = auth?.status === 'authenticated' ? auth.email : null

  return (
    <header className="app-header">
      <div className="app-header__brand">Basebaka</div>
      <div className="app-header__actions">
        {email && <span className="app-header__email">{email}</span>}
        <button
          type="button"
          className="app-header__btn app-header__btn--ghost"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          {t('login.signOut')}
        </button>
      </div>
    </header>
  )
}
