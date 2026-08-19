import { useTranslation } from 'react-i18next'
import '@/components/auth/styles.scss'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="home-screen">
      <h1 className="home-screen__title text-ink">{t('home.title')}</h1>
      <p className="home-screen__lead text-ink-soft">{t('home.lead')}</p>
    </div>
  )
}
