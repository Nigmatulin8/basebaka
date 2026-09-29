import { authStatus, logoutAuth, useAuthStatus } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export function SettingsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const authQuery = useAuthStatus()
  const queryClient = useQueryClient()

  const auth = authQuery.data
  const email = auth?.status === 'authenticated' ? auth.email : null

  const logoutMutation = useMutation({
    mutationFn: logoutAuth,
    onSuccess: async () => {
      await authStatus.invalidate(queryClient)
      await router.navigate({ to: '/login' })
    },
  })

  return (
    <div className="m-3">
      {email && <div className="mb-3"> {email} </div>}

      <button
        type="button"
        className="cursor-pointer rounded-md border border-line bg-transparent px-3 py-1.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60"
        disabled={logoutMutation.isPending}
        onClick={() => logoutMutation.mutate()}
      >
        {t('login.signOut')}
      </button>
    </div>
  )
}
