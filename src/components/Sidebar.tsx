import type { CSSProperties } from 'react'
import { APPS } from '../data/apps'
import { shortcuts } from '../data/shortcuts'
import { uniqueCategories } from '../data/shortcuts'
import { useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'
import type { ViewId } from '../types'
import { AppGlyph } from './AppIcons'

const VIEWS: { id: ViewId; labelKey: 'browse' | 'favorites' | 'compare' | 'quiz' | 'formulas' | 'tips' }[] = [
  { id: 'browse', labelKey: 'browse' },
  { id: 'favorites', labelKey: 'favorites' },
  { id: 'compare', labelKey: 'compare' },
  { id: 'quiz', labelKey: 'quiz' },
  { id: 'formulas', labelKey: 'formulas' },
  { id: 'tips', labelKey: 'tips' },
]

export function Sidebar() {
  const {
    appId,
    setAppId,
    categoryId,
    setCategoryId,
    view,
    setView,
    setQuery,
    label,
    appName,
    categoryName,
    favorites,
  } = useApp()

  const cats = uniqueCategories(shortcuts.filter((s) => s.appId === appId))

  return (
    <aside className="sidebar">
      <nav className="view-nav">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? 'nav on' : 'nav'}
            onClick={() => {
              setView(item.id)
              if (item.id !== 'browse') setQuery('')
            }}
          >
            {label(ui[item.labelKey])}
            {item.id === 'favorites' ? <span className="pill">{favorites.length}</span> : null}
          </button>
        ))}
      </nav>

      {(view === 'browse' || view === 'compare') && (
        <>
          <p className="side-label">{label(ui.allApps)}</p>
          <div className="app-list">
            {APPS.map((app) => (
              <button
                key={app.id}
                type="button"
                className={appId === app.id ? 'app-btn on' : 'app-btn'}
                style={{ '--accent': app.color } as CSSProperties}
                onClick={() => {
                  setAppId(app.id)
                  setCategoryId('all')
                  setView(view === 'compare' ? 'compare' : 'browse')
                }}
              >
                <span className="app-ico" style={{ color: app.color }}>
                  <AppGlyph id={app.id} />
                </span>
                <span>
                  {appName(app.id)}
                  <small>{shortcuts.filter((s) => s.appId === app.id).length}</small>
                </span>
              </button>
            ))}
          </div>

          <p className="side-label">{label(ui.allCategories)}</p>
          <div className="cat-list">
            <button
              type="button"
              className={categoryId === 'all' ? 'chip on' : 'chip'}
              onClick={() => setCategoryId('all')}
            >
              {label(ui.allCategories)}
            </button>
            {cats.map((id) => (
              <button
                key={id}
                type="button"
                className={categoryId === id ? 'chip on' : 'chip'}
                onClick={() => setCategoryId(id)}
              >
                {categoryName(id)}
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  )
}
