import { localeLabels } from '../i18n/ui'
import { LOCALES } from '../types'
import { countLabel, useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'

export function Header() {
  const { locale, setLocale, os, setOs, theme, setTheme, query, setQuery, label, filtered } =
    useApp()

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          ⌨
        </span>
        <div>
          <strong>{label(ui.appName)}</strong>
          <p>{label(ui.tagline)}</p>
        </div>
      </div>

      <label className="search">
        <span className="search-icon" aria-hidden>
          ⌕
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={label(ui.search)}
          type="search"
        />
        <em>{countLabel(filtered.length, locale)}</em>
      </label>

      <div className="top-actions">
        <div className="seg" role="group" aria-label={label(ui.windows)}>
          <button
            className={os === 'windows' ? 'on' : ''}
            onClick={() => setOs('windows')}
            type="button"
          >
            {label(ui.windows)}
          </button>
          <button className={os === 'mac' ? 'on' : ''} onClick={() => setOs('mac')} type="button">
            {label(ui.mac)}
          </button>
        </div>

        <select
          className="lang"
          value={locale}
          onChange={(e) => setLocale(e.target.value as typeof locale)}
          aria-label={label(ui.language)}
        >
          {LOCALES.map((code) => (
            <option key={code} value={code}>
              {localeLabels[code]}
            </option>
          ))}
        </select>

        <button className="ghost" type="button" onClick={() => window.print()}>
          {label(ui.print)}
        </button>
        <button
          className="ghost"
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? label(ui.themeLight) : label(ui.themeDark)}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
