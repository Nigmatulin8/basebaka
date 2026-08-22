import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Project, ProjectsListResponse } from '../../../shared/projects.js'
import { ensureFreshSession } from '../auth/google-oauth.js'
import { sendJson } from '../http.js'

export async function handleProjectsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): Promise<boolean> {
  if (pathname !== '/projects' || req.method !== 'GET') {
    return false
  }

  const session = await ensureFreshSession()
  if (!session) {
    sendJson(res, 401, { message: 'Sign in required' })
    return true
  }

  try {
    const upstream = await fetch(
      'https://firebase.googleapis.com/v1beta1/projects?pageSize=100',
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    )
    if (!upstream.ok) {
      sendJson(res, 502, {
        message: `Firebase projects failed (${upstream.status})`,
      })
      return true
    }

    const page = (await upstream.json()) as {
      results?: Array<{ projectId?: string; displayName?: string }>
    }

    const projects: Project[] = (page.results ?? [])
      .filter((item): item is { projectId: string; displayName?: string } =>
        Boolean(item.projectId),
      )
      .map((item) => ({
        projectId: item.projectId,
        displayName: item.displayName?.trim() || item.projectId,
      }))

    sendJson(res, 200, { projects } satisfies ProjectsListResponse)
  } catch (error) {
    sendJson(res, 502, {
      message:
        error instanceof Error ? error.message : 'Failed to list projects',
    })
  }

  return true
}
