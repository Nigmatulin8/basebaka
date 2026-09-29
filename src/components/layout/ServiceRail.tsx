import {
  Bell,
  Braces,
  Database,
  Globe,
  HardDrive,
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isServiceStub, useAppNav, type ServiceId } from './use-app-nav.ts'

const GROUPS: Array<Array<{ id: ServiceId; icon: LucideIcon }>> = [
  [
    { id: 'firestore', icon: Database },
    { id: 'realtime', icon: Radio },
    { id: 'storage', icon: HardDrive },
  ],
  [
    { id: 'auth', icon: KeyRound },
    { id: 'messaging', icon: Bell },
  ],
  [
    { id: 'functions', icon: Braces },
    { id: 'hosting', icon: Globe },
    { id: 'remoteConfig', icon: SlidersHorizontal },
  ],
]

export function ServiceRail() {
  const { t } = useTranslation()
  const nav = useAppNav()

  return (
    <nav
      aria-label={t('nav.rail')}
      className="flex h-full w-[52px] shrink-0 flex-col items-center border-r border-line bg-surface py-2.5"
    >
      <div className="flex flex-col items-center gap-[3px]">
        {GROUPS.map((group, groupIndex) => (
          <div
            key={group[0].id}
            className="flex flex-col items-center gap-[3px]"
          >
            {groupIndex > 0 && (
              <span className="my-1 h-px w-[22px] bg-line" aria-hidden />
            )}
            {group.map((item) => {
              const Icon = item.icon
              const active = nav.service === item.id
              const stub = isServiceStub(item.id)
              const label = t(`services.${item.id}`)
              return (
                <button
                  key={item.id}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => nav.setService(item.id)}
                  className={`relative flex size-9 cursor-pointer items-center justify-center rounded-lg border ${
                    active
                      ? 'border-rail-active bg-accent-soft text-accent'
                      : 'border-transparent text-ink-muted hover:bg-surface2 hover:text-ink-soft'
                  }`}
                >
                  <Icon size={17} />
                  {stub && (
                    <span className="absolute top-1 right-1 size-1 rounded-full bg-warning" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <button
        type="button"
        title={
          nav.sidebarOpen ? t('nav.collapseSidebar') : t('nav.expandSidebar')
        }
        aria-label={
          nav.sidebarOpen ? t('nav.collapseSidebar') : t('nav.expandSidebar')
        }
        aria-pressed={nav.sidebarOpen}
        onClick={nav.toggleSidebar}
        className="mt-auto flex size-9 cursor-pointer items-center justify-center rounded-lg border border-transparent text-ink-muted hover:bg-surface2 hover:text-ink-soft"
      >
        {nav.sidebarOpen ? (
          <PanelLeftClose size={17} />
        ) : (
          <PanelLeftOpen size={17} />
        )}
      </button>
    </nav>
  )
}
