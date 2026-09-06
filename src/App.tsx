import { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { ShortcutDetail } from './components/ShortcutDetail'
import { BrowseView } from './views/BrowseView'
import { FavoritesView } from './views/FavoritesView'
import { CompareView } from './views/CompareView'
import { QuizView } from './views/QuizView'
import { FormulasView } from './views/FormulasView'
import { TipsView } from './views/TipsView'
import { ui } from './i18n/ui'
import { bootstrapAds, showInterstitialAfterNavigation } from './services/ads'

function Shell() {
  const { view, theme, locale, query, label } = useApp()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = locale
    document.title = `${label(ui.appName)} · ${label(ui.tagline)}`
  }, [theme, locale, label])

  useEffect(() => {
    void bootstrapAds()
  }, [])

  useEffect(() => {
    void showInterstitialAfterNavigation()
  }, [view])

  return (
    <div className="shell">
      <Header />
      <div className="body">
        <Sidebar />
        <main>
          {query.trim() && view !== 'quiz' && view !== 'formulas' && view !== 'tips' ? (
            <BrowseView />
          ) : view === 'favorites' ? (
            <FavoritesView />
          ) : view === 'compare' ? (
            <CompareView />
          ) : view === 'quiz' ? (
            <QuizView />
          ) : view === 'formulas' ? (
            <FormulasView />
          ) : view === 'tips' ? (
            <TipsView />
          ) : (
            <BrowseView />
          )}
        </main>
      </div>
      <ShortcutDetail />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
