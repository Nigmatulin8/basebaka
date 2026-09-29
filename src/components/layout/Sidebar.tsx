import { useProjects } from '@/lib/api'
import { Link } from '@tanstack/react-router'
import { ChevronDown, Folder, Plus, Search, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNav } from './use-app-nav.ts'

const CHIP_CLASSES = [
  'bg-chip-blue',
  'bg-chip-purple',
  'bg-chip-amber',
] as const

export function Sidebar() {
  const { t } = useTranslation()
  const nav = useAppNav()
  const { data, isPending, isError, error } = useProjects()
  const [query, setQuery] = useState('')

  const projects = data?.projects ?? []
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? projects.filter((project) => {
        if (project.displayName.toLowerCase().includes(needle)) {
          return true
        }
        if (project.projectId.toLowerCase().includes(needle)) {
          return true
        }
        return (nav.collectionsByProject[project.projectId] ?? []).some(
          (item) => item.name.toLowerCase().includes(needle),
        )
      })
    : projects

  return (
    <div
      className={`h-full shrink-0 overflow-hidden transition-[width] duration-[180ms] ease-out ${
        nav.sidebarOpen ? 'w-[210px]' : 'w-0'
      }`}
    >
      <aside
        className="flex h-full w-[210px] flex-col border-r border-line bg-surface px-2 pt-2"
        aria-label={t('nav.sidebar')}
        aria-hidden={!nav.sidebarOpen}
        inert={!nav.sidebarOpen}
      >
        <div className="relative mb-2 shrink-0">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            className="w-full rounded-md border border-line bg-surface2 py-[7px] pr-7 pl-8 text-xs text-ink outline-none placeholder:text-ink-muted"
          />
          {query && (
            <button
              type="button"
              aria-label={t('common.clear')}
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-ink-muted hover:text-ink"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isPending && (
            <p className="px-2 py-2 text-xs text-ink-muted">
              {t('home.projectsLoading')}
            </p>
          )}
          {isError && (
            <p className="px-2 py-2 text-xs text-danger">
              {error instanceof Error ? error.message : t('home.projectsError')}
            </p>
          )}
          {!isPending && !isError && visible.length === 0 && (
            <p className="px-2 py-2 text-xs text-ink-muted">
              {t('home.projectsEmpty')}
            </p>
          )}

          {visible.length > 0 && (
            <section>
              <h2 className="px-2 pt-1 pb-1 text-[10px] font-medium tracking-wide text-ink-muted uppercase">
                {t('nav.own')}
              </h2>
              <ul>
                {visible.map((project) => {
                  const index = projects.findIndex(
                    (item) => item.projectId === project.projectId,
                  )
                  const expanded =
                    needle.length > 0 || nav.expandedIds.has(project.projectId)
                  const collections =
                    nav.collectionsByProject[project.projectId] ?? []
                  const projectSelected =
                    nav.selectedProjectId === project.projectId &&
                    !nav.selectedCollectionId

                  return (
                    <li key={project.projectId}>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => nav.toggleProject(project.projectId)}
                        className={`flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-[7px] text-left ${
                          projectSelected ? 'bg-surface2' : 'hover:bg-surface2'
                        }`}
                      >
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-ink-muted transition-transform ${
                            expanded ? '' : '-rotate-90'
                          }`}
                        />
                        <span
                          className={`size-2 shrink-0 rounded-[2px] ${CHIP_CLASSES[index % CHIP_CLASSES.length]}`}
                        />
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
                          {project.displayName}
                        </span>
                        <span className="size-[5px] shrink-0 rounded-full bg-success" />
                      </button>

                      {expanded && (
                        <ul>
                          {collections.map((collection) => {
                            const selected =
                              nav.selectedProjectId === project.projectId &&
                              nav.selectedCollectionId === collection.id
                            return (
                              <li key={collection.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    nav.selectCollection(
                                      project.projectId,
                                      collection.id,
                                    )
                                  }
                                  className={`flex w-full cursor-pointer items-center gap-1.5 py-[7px] pr-2 pl-[26px] text-left font-mono text-[11px] ${
                                    selected
                                      ? 'bg-surface2 text-ink'
                                      : 'text-ink-soft hover:bg-surface2'
                                  }`}
                                >
                                  <Folder
                                    size={13}
                                    className="shrink-0 text-ink-muted"
                                  />
                                  <span className="min-w-0 truncate">
                                    {collection.name}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                nav.addCollection(project.projectId)
                              }
                              className="flex w-full cursor-pointer items-center gap-1.5 py-[7px] pr-2 pl-[26px] text-left font-mono text-[11px] text-ink-muted hover:text-accent"
                            >
                              <Plus size={13} className="shrink-0" />
                              {t('nav.addCollection')}
                            </button>
                          </li>
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {!isPending && !isError && !needle && (
            <section>
              <h2 className="px-2 pt-3 pb-1 text-[10px] font-medium tracking-wide text-ink-muted uppercase">
                {t('nav.shared')}
              </h2>
            </section>
          )}
        </div>

        <div className="mt-auto shrink-0 border-t border-line">
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-md p-2 text-xs text-ink hover:bg-surface2"
          >
            <Settings size={15} />
            {t('nav.settings')}
          </Link>
        </div>
      </aside>
    </div>
  )
}
