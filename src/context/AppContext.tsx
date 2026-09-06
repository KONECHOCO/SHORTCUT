import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { APPS } from '../data/apps'
import { shortcuts } from '../data/shortcuts'
import { interpolate, t, ui } from '../i18n/ui'
import { detectLocale, detectOS } from '../lib/detect'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { I18nText, Locale, OS, Shortcut, ViewId } from '../types'

type Theme = 'dark' | 'light'

interface AppContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  os: OS
  setOs: (os: OS) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  view: ViewId
  setView: (view: ViewId) => void
  appId: string
  setAppId: (id: string) => void
  categoryId: string
  setCategoryId: (id: string) => void
  query: string
  setQuery: (q: string) => void
  selected: Shortcut | null
  setSelected: (item: Shortcut | null) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  filtered: Shortcut[]
  label: (text: I18nText) => string
  appName: (id: string) => string
  categoryName: (id: string) => string
  subcategoryName: (id: string) => string
}

const AppContext = createContext<AppContextValue | null>(null)

function matchesQuery(item: Shortcut, q: string, locale: Locale): boolean {
  if (!q) return true
  const hay = [
    t(item.title, locale),
    t(item.description, locale),
    t(item.example, locale),
    t(item.result, locale),
    item.keys.windows.join(' '),
    item.keys.mac.join(' '),
    item.appId,
    item.categoryId,
    item.subcategoryId,
  ]
    .join(' ')
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useLocalStorage<Locale>('sa-locale', detectLocale())
  const [os, setOs] = useLocalStorage<OS>('sa-os', detectOS())
  const [theme, setTheme] = useLocalStorage<Theme>('sa-theme', 'dark')
  const [favorites, setFavorites] = useLocalStorage<string[]>('sa-favs', [])
  const [view, setView] = useState<ViewId>('browse')
  const [appId, setAppId] = useState(APPS[0].id)
  const [categoryId, setCategoryId] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Shortcut | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim()
    return shortcuts.filter((item) => {
      if (q) return matchesQuery(item, q, locale)
      if (view === 'favorites') return favorites.includes(item.id)
      if (appId !== 'all' && item.appId !== appId) return false
      if (categoryId !== 'all' && item.categoryId !== categoryId) return false
      return true
    })
  }, [appId, categoryId, favorites, locale, query, view])

  const value = useMemo<AppContextValue>(
    () => ({
      locale,
      setLocale,
      os,
      setOs,
      theme,
      setTheme,
      view,
      setView,
      appId,
      setAppId,
      categoryId,
      setCategoryId,
      query,
      setQuery,
      selected,
      setSelected,
      favorites,
      toggleFavorite: (id) =>
        setFavorites((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        ),
      isFavorite: (id) => favorites.includes(id),
      filtered,
      label: (text) => t(text, locale),
      appName: (id) => t(ui.apps[id as keyof typeof ui.apps] ?? ui.allApps, locale),
      categoryName: (id) =>
        t(ui.categories[id as keyof typeof ui.categories] ?? ui.allCategories, locale),
      subcategoryName: (id) =>
        t(ui.subcategories[id as keyof typeof ui.subcategories] ?? ui.subcategories.basic, locale),
    }),
    [
      appId,
      categoryId,
      favorites,
      filtered,
      locale,
      os,
      selected,
      setFavorites,
      setLocale,
      setOs,
      setTheme,
      theme,
      view,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function countLabel(n: number, locale: Locale) {
  return interpolate(t(ui.shortcutsCount, locale), { n })
}
