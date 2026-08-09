import { isTauri } from '@tauri-apps/api/core'
import { openUrl } from '@tauri-apps/plugin-opener'

export type OpenExternalOptions = {
  preOpenedWindow?: Window | null
}

export function preOpenExternalBrowserTab(): Window | null {
  if (isTauri()) {
    return null
  }
  return window.open('about:blank', '_blank', 'noopener,noreferrer')
}

export async function openExternalUrl(
  url: string,
  options?: OpenExternalOptions,
): Promise<void> {
  if (isTauri()) {
    await openUrl(url)
    return
  }

  const preOpened = options?.preOpenedWindow
  if (preOpened && !preOpened.closed) {
    preOpened.location.href = url
    return
  }

  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (popup) {
    return
  }

  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.append(link)
  link.click()
  link.remove()
}
