import type { Project } from '../../../shared/projects.js'

const FIREBASE_PROJECTS_URL =
  'https://firebase.googleapis.com/v1beta1/projects?pageSize=100'

export async function listProjects(accessToken: string): Promise<Project[]> {
  const res = await fetch(FIREBASE_PROJECTS_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Firebase projects failed (${res.status})`)
  }

  const page = (await res.json()) as {
    results?: Array<{ projectId?: string; displayName?: string }>
  }

  return (page.results ?? [])
    .filter((item): item is { projectId: string; displayName?: string } =>
      Boolean(item.projectId),
    )
    .map((item) => ({
      projectId: item.projectId,
      displayName: item.displayName?.trim() || item.projectId,
    }))
}
