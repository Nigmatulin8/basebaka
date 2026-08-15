import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/auth/AppHeader.tsx'
import '@/components/auth/styles.scss'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <>
      <AppHeader />
      <div className="home-screen bg-base text-ink">
        <h1 className="home-screen__title text-ink">{t('home.title')}</h1>
        <p className="home-screen__lead text-ink-soft">{t('home.lead')}</p>
      </div>
    </>
  )
}
