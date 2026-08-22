import { useQuery } from '@tanstack/react-query'
import type { ProjectsListResponse } from '@shared/projects.ts'
import { readSidecarErrorMessage, sidecarFetch } from './sidecar-client.ts'

export const projectsQueryKeys = {
  list: ['projects', 'list'] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: projectsQueryKeys.list,
    queryFn: fetchProjects,
    retry: 1,
  })
}

export async function fetchProjects(): Promise<ProjectsListResponse> {
  const res = await sidecarFetch('/projects')
  if (!res.ok) {
    throw new Error(
      (await readSidecarErrorMessage(res)) ??
        `Projects request failed (${res.status})`,
    )
  }
  return res.json() as Promise<ProjectsListResponse>
}
