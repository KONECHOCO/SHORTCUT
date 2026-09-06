import { APPS } from '../data/apps'
import { uniqueCategories, uniqueSubcategories } from '../data/shortcuts'
import { countLabel, useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'
import { ShortcutCard } from '../components/ShortcutCard'

export function BrowseView() {
  const { filtered, query, locale, label, categoryName, subcategoryName } = useApp()

  if (!filtered.length) {
    return <p className="empty">{label(ui.noResults)}</p>
  }

  if (query.trim()) {
    return (
      <section className="stack">
        <header className="view-head">
          <h2>{label(ui.search)}</h2>
          <p>{countLabel(filtered.length, locale)}</p>
        </header>
        <div className="grid">
          {filtered.map((item) => (
            <ShortcutCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    )
  }

  const cats = uniqueCategories(filtered)
  return (
    <section className="stack">
      {cats.map((cat) => {
        const inCat = filtered.filter((s) => s.categoryId === cat)
        const accent = APPS.find((a) => a.id === inCat[0]?.appId)?.color
        return (
          <div key={cat} className="cat-block">
            <h2 style={{ color: accent }}>{categoryName(cat)}</h2>
            {uniqueSubcategories(inCat, cat).map((sub) => {
              const items = inCat.filter((s) => s.subcategoryId === sub)
              return (
                <div key={sub} className="sub-block">
                  <h3>{subcategoryName(sub)}</h3>
                  <div className="grid">
                    {items.map((item) => (
                      <ShortcutCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </section>
  )
}
