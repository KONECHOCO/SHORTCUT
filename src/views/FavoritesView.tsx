import { shortcuts } from '../data/shortcuts'
import { useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'
import { ShortcutCard } from '../components/ShortcutCard'

export function FavoritesView() {
  const { favorites, label } = useApp()
  const items = shortcuts.filter((s) => favorites.includes(s.id))

  if (!items.length) {
    return <p className="empty">{label(ui.noFavorites)}</p>
  }

  return (
    <section className="stack">
      <header className="view-head">
        <h2>{label(ui.favorites)}</h2>
      </header>
      <div className="grid">
        {items.map((item) => (
          <ShortcutCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
