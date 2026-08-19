import { Input } from '@ui/Input'
import { Link } from '@tanstack/react-router'
import { Search, Settings } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function SideNav() {
  const { t } = useTranslation()
  const [searchString, setSearchString] = useState('')

  return (
    <aside
      className="flex h-svh w-[250px] shrink-0 flex-col border-r border-line bg-surface px-2.5 py-2"
      aria-label={t('sideNav.label')}
    >
      <div className="w-full">
        <Input
          icon={Search}
          placeholder={t('sideNav.searchPlaceholder')}
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
          onClear={() => setSearchString('')}
        />
      </div>

      <div className="my-3 w-full grow" />

      <div className="w-full border-t border-line py-2">
        <Link
          to="/settings"
          className="flex cursor-pointer items-center rounded-lg px-2 py-2 text-lg text-ink transition-colors hover:bg-surface2"
        >
          <Settings size={18} />
          <span className="ml-2">{t('sideNav.settings')}</span>
        </Link>
      </div>
    </aside>
  )
}
