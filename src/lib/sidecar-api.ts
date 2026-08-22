import {
  useQuery,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { readSidecarErrorMessage, sidecarFetch } from './sidecar-client.ts'

async function throwIfNotOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) {
    return
  }
  throw new Error((await readSidecarErrorMessage(res)) ?? fallback)
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await sidecarFetch(path)
  await throwIfNotOk(res, `Request failed (${res.status})`)
  return res.json() as Promise<T>
}

export async function postJson<T>(path: string): Promise<T> {
  const res = await sidecarFetch(path, { method: 'POST' })
  await throwIfNotOk(res, `Request failed (${res.status})`)
  return res.json() as Promise<T>
}

export async function postVoid(path: string): Promise<void> {
  const res = await sidecarFetch(path, { method: 'POST' })
  await throwIfNotOk(res, `Request failed (${res.status})`)
}

export function createSidecarQuery<T>(
  key: readonly string[],
  fetch: () => Promise<T>,
) {
  return {
    key,
    fetch,
    use(): UseQueryResult<T> {
      return useQuery({ queryKey: key, queryFn: fetch, retry: 1 })
    },
    prefetch(client: QueryClient) {
      return client.fetchQuery({ queryKey: key, queryFn: fetch })
    },
    invalidate(client: QueryClient) {
      return client.invalidateQueries({ queryKey: key })
    },
  }
}
