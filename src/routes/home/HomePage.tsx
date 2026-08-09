import { useTranslation } from 'react-i18next'
import { AppHeader } from '../../components/auth/AppHeader.tsx'
import '../../components/auth/styles.scss'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <>
      <AppHeader />
      <div className="home-screen">
        <h1 className="home-screen__title">{t('home.title')}</h1>
        <p className="home-screen__lead">{t('home.lead')}</p>
      </div>
    </>
  )
}
