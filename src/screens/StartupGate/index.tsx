import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_SERVER_PORT } from '@shared/config.ts'
import { ServerPortContext } from '@/lib/server-port-context.tsx'
import i18n from '@/lib/i18n.ts'
import {
  fetchStartupStatus,
  restartApplication,
  runningInTauri,
  watchStartupStatus,
  type StartupStatus,
} from '@/lib/startup.ts'
import './styles.scss'

type Props = {
  children: ReactNode
}

export function StartupGate({ children }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<StartupStatus>(() =>
    runningInTauri()
      ? { status: 'loading' }
      : { status: 'ready', port: DEFAULT_SERVER_PORT },
  )
  const [restarting, setRestarting] = useState(false)

  useEffect(() => {
    if (!runningInTauri()) {
      return
    }

    let unlisten: (() => void) | undefined

    watchStartupStatus(setStatus)
      .then((dispose) => {
        unlisten = dispose
      })
      .catch(async () => {
        try {
          setStatus(await fetchStartupStatus())
        } catch (error) {
          setStatus({
            status: 'failed',
            message:
              error instanceof Error
                ? error.message
                : i18n.t('startupGate.statusReadFailed'),
          })
        }
      })

    return () => {
      unlisten?.()
    }
  }, [])

  if (status.status === 'loading') {
    return (
      <div className="startup-gate startup-gate--loading bg-base">
        <div className="startup-gate__clouds" aria-hidden="true">
          <div className="startup-gate__cloud startup-gate__cloud--1" />
          <div className="startup-gate__cloud startup-gate__cloud--2" />
          <div className="startup-gate__cloud startup-gate__cloud--3" />
          <div className="startup-gate__cloud startup-gate__cloud--4" />
          <div className="startup-gate__cloud startup-gate__cloud--5" />
        </div>

        <div className="startup-gate__loader" aria-hidden="true">
          <span>
            <span />
            <span />
            <span />
            <span />
          </span>
          <div className="startup-gate__base">
            <span />
            <div className="startup-gate__face" />
          </div>
        </div>

        <div className="startup-gate__fazers" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  if (status.status === 'failed') {
    return (
      <div className="startup-gate startup-gate--failed bg-base">
        <h1 className="startup-gate__title text-ink">
          {t('startupGate.failedTitle')}
        </h1>
        <p className="startup-gate__subtitle text-ink-soft">
          {t('startupGate.failedSubtitle')}
        </p>
        <pre className="startup-gate__message text-ink-muted">
          {status.message}
        </pre>
        <button
          type="button"
          className="startup-gate__restart bg-accent-soft text-accent border border-accent"
          disabled={restarting}
          onClick={() => {
            setRestarting(true)
            restartApplication().catch(() => {
              setRestarting(false)
            })
          }}
        >
          {restarting ? t('startupGate.restarting') : t('startupGate.restart')}
        </button>
      </div>
    )
  }

  return (
    <ServerPortContext.Provider
      value={status.status === 'ready' ? status.port : DEFAULT_SERVER_PORT}
    >
      {children}
    </ServerPortContext.Provider>
  )
}
