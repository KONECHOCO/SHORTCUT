import { tips } from '../data/tips'
import { t } from '../i18n/ui'
import { useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'

export function TipsView() {
  const { locale, os, label } = useApp()
  const list = tips.filter((tip) => tip.os === 'both' || tip.os === os)

  return (
    <section className="stack">
      <header className="view-head">
        <h2>{label(ui.tips)}</h2>
        <p>{label(ui.tipsLead)}</p>
      </header>
      <div className="grid tips">
        {list.map((tip) => (
          <article key={tip.id} className="card tip">
            <h3>{t(tip.title, locale)}</h3>
            <section className="block example">
              <h4>{label(ui.howTo)}</h4>
              <p>{t(tip.steps, locale)}</p>
            </section>
            <section className="block result">
              <h4>{label(ui.result)}</h4>
              <p>{t(tip.result, locale)}</p>
            </section>
          </article>
        ))}
      </div>
    </section>
  )
}
