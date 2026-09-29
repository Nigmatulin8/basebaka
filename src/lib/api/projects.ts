import type { ProjectsListResponse } from '@shared/projects.ts'
import { createSidecarQuery, getJson } from '../sidecar-api.ts'

export const projects = createSidecarQuery(['projects', 'list'], () =>
  getJson<ProjectsListResponse>('/projects'),
)
export const useProjects = projects.use
