import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export type StartupStatus =
  | { status: 'loading' }
  | { status: 'ready'; port: number }
  | { status: 'failed'; message: string }

export const STARTUP_READY_EVENT = 'server-startup-ready'
export const STARTUP_FAILED_EVENT = 'server-startup-failed'

export function runningInTauri(): boolean {
  return isTauri()
}

export async function fetchStartupStatus(): Promise<StartupStatus> {
  return invoke<StartupStatus>('get_server_startup_state')
}

export async function restartApplication(): Promise<void> {
  await invoke('restart_application')
}

export async function watchStartupStatus(
  onChange: (status: StartupStatus) => void,
): Promise<() => void> {
  const current = await fetchStartupStatus()
  onChange(current)

  const unlistenReady = await listen<number>(STARTUP_READY_EVENT, (event) => {
    onChange({ status: 'ready', port: event.payload })
  })

  const unlistenFailed = await listen<string>(STARTUP_FAILED_EVENT, (event) => {
    onChange({ status: 'failed', message: event.payload })
  })

  return () => {
    unlistenReady()
    unlistenFailed()
  }
}
