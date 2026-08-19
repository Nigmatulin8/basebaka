import { authQueryKeys, logoutAuth, useAuthStatus } from '@/lib/auth-api.ts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerPort } from '@/lib/server-port-context.tsx'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export function SettingsPage() {
		const router = useRouter()
		const port = useServerPort()
		const { t } = useTranslation()
		const authQuery = useAuthStatus()
	  const queryClient = useQueryClient()

		const auth = authQuery.data
		const email = auth?.status === 'authenticated' ? auth.email : null

	  const logoutMutation = useMutation({
			mutationFn: () => logoutAuth(port),
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: authQueryKeys.status(port),
				})
				await router.navigate({ to: '/login' })
			},
		})

	return <div className="m-3">
		{email && (<div className='mb-3'> {email} </div>)}

		<button
			type="button"
			className="cursor-pointer rounded-md border border-line bg-transparent px-3 py-1.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60"
			disabled={logoutMutation.isPending}
			onClick={() => logoutMutation.mutate()}
		>
			{t('login.signOut')}
		</button>
	</div>
}
