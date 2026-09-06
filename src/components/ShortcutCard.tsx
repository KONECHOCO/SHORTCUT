import type { CSSProperties } from 'react'
import { APPS } from '../data/apps'
import { t } from '../i18n/ui'
import { useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'
import type { Shortcut } from '../types'
import { KeyCombo } from './KeyCombo'

export function ShortcutCard({ item }: { item: Shortcut }) {
  const { os, locale, appName, categoryName, subcategoryName, setSelected, isFavorite } = useApp()
  const accent = APPS.find((a) => a.id === item.appId)?.color ?? '#8b93a7'

  return (
    <article className="card" style={{ '--accent': accent } as CSSProperties}>
      <button type="button" className="card-main" onClick={() => setSelected(item)}>
        <div className="card-meta">
          <span className="dot" />
          <span>{appName(item.appId)}</span>
          <span className="sep">/</span>
          <span>{categoryName(item.categoryId)}</span>
          <span className="sep">/</span>
          <span>{subcategoryName(item.subcategoryId)}</span>
          {isFavorite(item.id) ? <span className="star">★</span> : null}
        </div>
        <h3>{t(item.title, locale)}</h3>
        <p>{t(item.description, locale)}</p>
        <KeyCombo keys={item.keys[os]} />
      </button>
      <span className="sr-only">{ui.openDetail[locale]}</span>
    </article>
  )
}
