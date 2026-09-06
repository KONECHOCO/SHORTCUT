import type { CSSProperties } from 'react'
import { APPS } from '../data/apps'
import { formatKeys } from '../lib/detect'
import { t } from '../i18n/ui'
import { useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'
import { KeyCombo } from './KeyCombo'
import { useEffect, useState } from 'react'

export function ShortcutDetail() {
  const {
    selected,
    setSelected,
    locale,
    os,
    label,
    appName,
    categoryName,
    subcategoryName,
    isFavorite,
    toggleFavorite,
  } = useApp()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, setSelected])

  if (!selected) return null
  const accent = APPS.find((a) => a.id === selected.appId)?.color ?? '#8b93a7'
  const keys = selected.keys[os]

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatKeys(keys))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-back" onClick={() => setSelected(null)}>
      <aside
        className="modal"
        style={{ '--accent': accent } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <header className="modal-head">
          <div>
            <p className="crumbs">
              {appName(selected.appId)} · {categoryName(selected.categoryId)} ·{' '}
              {subcategoryName(selected.subcategoryId)}
            </p>
            <h2>{t(selected.title, locale)}</h2>
          </div>
          <button type="button" className="ghost" onClick={() => setSelected(null)}>
            {label(ui.close)}
          </button>
        </header>

        <div className="os-grid">
          <section>
            <h3>{label(ui.windowsKeys)}</h3>
            <KeyCombo keys={selected.keys.windows} size="lg" />
          </section>
          <section>
            <h3>{label(ui.macKeys)}</h3>
            <KeyCombo keys={selected.keys.mac} size="lg" />
          </section>
        </div>

        <section className="block">
          <h3>{label(ui.description)}</h3>
          <p>{t(selected.description, locale)}</p>
        </section>
        <section className="block example">
          <h3>{label(ui.example)}</h3>
          <p>{t(selected.example, locale)}</p>
        </section>
        <section className="block result">
          <h3>{label(ui.result)}</h3>
          <p>{t(selected.result, locale)}</p>
        </section>

        <footer className="modal-actions">
          <button type="button" className="primary" onClick={copy}>
            {copied ? label(ui.copied) : label(ui.copyKeys)}
          </button>
          <button type="button" className="ghost" onClick={() => toggleFavorite(selected.id)}>
            {isFavorite(selected.id) ? `★ ${label(ui.removeFavorite)}` : `☆ ${label(ui.addFavorite)}`}
          </button>
        </footer>
      </aside>
    </div>
  )
}
