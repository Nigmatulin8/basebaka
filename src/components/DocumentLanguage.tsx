import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/** Keeps `<html lang>` in sync with the active i18next locale. */
export function DocumentLanguage() {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language
  }, [i18n.language, i18n.resolvedLanguage])

  return null
}
