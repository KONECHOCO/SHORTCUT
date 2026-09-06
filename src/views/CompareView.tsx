import { t } from '../i18n/ui'
import { useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'
import { KeyCombo } from '../components/KeyCombo'

export function CompareView() {
  const { filtered, locale, label, setSelected, categoryName } = useApp()

  if (!filtered.length) {
    return <p className="empty">{label(ui.noResults)}</p>
  }

  return (
    <section className="stack">
      <header className="view-head">
        <h2>{label(ui.compare)}</h2>
        <p>{label(ui.compareLead)}</p>
      </header>
      <div className="compare-table">
        <div className="compare-row head">
          <span>{label(ui.description)}</span>
          <span>{label(ui.windows)}</span>
          <span>{label(ui.mac)}</span>
        </div>
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            className="compare-row"
            onClick={() => setSelected(item)}
          >
            <span>
              <strong>{t(item.title, locale)}</strong>
              <small>
                {categoryName(item.categoryId)} — {t(item.result, locale)}
              </small>
            </span>
            <KeyCombo keys={item.keys.windows} size="sm" />
            <KeyCombo keys={item.keys.mac} size="sm" />
          </button>
        ))}
      </div>
    </section>
  )
}
