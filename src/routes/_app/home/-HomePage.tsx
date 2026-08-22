import { useTranslation } from 'react-i18next'
import { useProjects } from '@/lib/api'
import '@/components/auth/styles.scss'

export function HomePage() {
  const { t } = useTranslation()
  const { data, isPending, isError, error } = useProjects()
  const projects = data?.projects ?? []

  return (
    <div className="home-screen">
      <h1 className="home-screen__title text-ink">{t('home.title')}</h1>
      <p className="home-screen__lead text-ink-soft">{t('home.lead')}</p>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-ink">
          {t('home.projectsTitle')}
        </h2>

        {isPending && (
          <p className="text-sm text-ink-muted">{t('home.projectsLoading')}</p>
        )}

        {isError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error instanceof Error ? error.message : t('home.projectsError')}
          </p>
        )}

        {!isPending && !isError && projects.length === 0 && (
          <p className="text-sm text-ink-muted">{t('home.projectsEmpty')}</p>
        )}

        {projects.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {projects.map((project) => (
              <li
                key={project.projectId}
                className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <span className="text-sm text-ink">{project.displayName}</span>
                <span className="font-mono text-xs text-ink-muted">
                  {project.projectId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
