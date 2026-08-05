import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import ru from '../locales/ru.json'

export const appLanguages = ['en', 'ru'] as const
export type AppLanguage = (typeof appLanguages)[number]

function resolveInitialLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') {
    return 'en'
  }

  const primary = navigator.language.split('-')[0]?.toLowerCase()
  return primary === 'ru' ? 'ru' : 'en'
}

export const i18nReady = i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: [...appLanguages],
  nonExplicitSupportedLngs: true,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export async function changeAppLanguage(language: AppLanguage) {
  await i18n.changeLanguage(language)
  document.documentElement.lang = language
}

export default i18n
