import { createContext, useContext, useState, type Context } from 'react'

export type ServiceId =
  | 'firestore'
  | 'realtime'
  | 'storage'
  | 'auth'
  | 'messaging'
  | 'functions'
  | 'hosting'
  | 'remoteConfig'

export type CollectionItem = {
  id: string
  name: string
}

const STUB_SERVICES = new Set<ServiceId>([
  'realtime',
  'messaging',
  'functions',
  'hosting',
  'remoteConfig',
])

export function isServiceStub(service: ServiceId): boolean {
  return STUB_SERVICES.has(service)
}

export type AppNav = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  service: ServiceId
  setService: (service: ServiceId) => void
  expandedIds: ReadonlySet<string>
  toggleProject: (projectId: string) => void
  selectedProjectId: string | null
  selectedCollectionId: string | null
  collectionsByProject: Record<string, CollectionItem[]>
  selectCollection: (projectId: string, collectionId: string) => void
  addCollection: (projectId: string) => void
}

export const AppNavContext: Context<AppNav | null> =
  createContext<AppNav | null>(null)

export function useAppNav(): AppNav {
  const value = useContext(AppNavContext)
  if (!value) {
    throw new Error('useAppNav must be used inside AppNavProvider')
  }
  return value
}

export function useAppNavState(): AppNav {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [service, setService] = useState<ServiceId>('firestore')
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  )
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null)
  const [collectionsByProject, setCollectionsByProject] = useState<
    Record<string, CollectionItem[]>
  >({})

  return {
    sidebarOpen,
    toggleSidebar: () => setSidebarOpen((open) => !open),
    service,
    setService,
    expandedIds,
    toggleProject: (projectId) => {
      setExpandedIds((current) => {
        const next = new Set(current)
        if (next.has(projectId)) {
          next.delete(projectId)
        } else {
          next.add(projectId)
        }
        return next
      })
      setSelectedProjectId(projectId)
      setSelectedCollectionId(null)
    },
    selectedProjectId,
    selectedCollectionId,
    collectionsByProject,
    selectCollection: (projectId, collectionId) => {
      setSelectedProjectId(projectId)
      setSelectedCollectionId(collectionId)
      setService('firestore')
      setExpandedIds((current) => new Set(current).add(projectId))
    },
    addCollection: (projectId) => {
      const id = crypto.randomUUID()
      setCollectionsByProject((current) => {
        const list = current[projectId] ?? []
        return {
          ...current,
          [projectId]: [...list, { id, name: `collection-${list.length + 1}` }],
        }
      })
      setSelectedProjectId(projectId)
      setSelectedCollectionId(id)
      setService('firestore')
      setExpandedIds((current) => new Set(current).add(projectId))
    },
  }
}
