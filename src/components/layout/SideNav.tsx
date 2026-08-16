import { Input } from '@ui/Input'
import { Search, Settings } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function SideNav() {
  const { t } = useTranslation()
  const [searchString, setSearchString] = useState('')

  return (
    <aside
      className="flex h-svh w-52.5 shrink-0 flex-col border-r border-line bg-surface px-2.5 py-2"
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

      <div className="w-full grow my-3">123</div>

      <div className="w-full border-line border-t py-2">
        <div className="flex items-center px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-zinc-700/50 text-lg">
          <Settings size={18} />
          <span className="ml-2">{t('sideNav.settings')}</span>
        </div>
      </div>
    </aside>
  )
}
