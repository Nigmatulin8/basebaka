import type { ProjectsListResponse } from '../../../shared/projects.js'
import { sendJson } from '../http.js'
import { get, requireSession } from '../router.js'
import { listProjects } from './list.js'

get('/projects', async (_req, res) => {
  const session = await requireSession(res)
  if (!session) {
    return
  }

  try {
    const projects = await listProjects(session.accessToken)
    sendJson(res, 200, { projects } satisfies ProjectsListResponse)
  } catch (error) {
    sendJson(res, 502, {
      message:
        error instanceof Error ? error.message : 'Failed to list projects',
    })
  }
})
