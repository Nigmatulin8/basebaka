import { useTranslation } from 'react-i18next'
import { isServiceStub, useAppNav } from '@/components/layout/use-app-nav.ts'

export function HomePage() {
  const { t } = useTranslation()
  const nav = useAppNav()
  const collection = nav.collectionsByProject[
    nav.selectedProjectId ?? ''
  ]?.find((item) => item.id === nav.selectedCollectionId)

  return (
    <div className="px-6 py-8">
      <h1 className="mb-2 text-xl font-semibold text-ink">
        {t(`services.${nav.service}`)}
      </h1>
      <p className="font-mono text-sm text-ink-soft">
        {nav.selectedProjectId ?? t('nav.noProject')}
        {collection ? ` / ${collection.name}` : ''}
      </p>
      {isServiceStub(nav.service) && (
        <p className="mt-4 text-sm text-ink-muted">{t('nav.serviceStub')}</p>
      )}
    </div>
  )
}
