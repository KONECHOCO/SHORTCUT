import { formulas } from '../data/formulas'
import { t } from '../i18n/ui'
import { useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'

export function FormulasView() {
  const { locale, label } = useApp()
  return (
    <section className="stack">
      <header className="view-head">
        <h2>{label(ui.formulas)}</h2>
        <p>{label(ui.formulasLead)}</p>
      </header>
      <div className="grid formulas">
        {formulas.map((item) => (
          <article key={item.id} className="card formula">
            <code>{item.syntax}</code>
            <h3>{t(item.title, locale)}</h3>
            <p>{t(item.description, locale)}</p>
            <section className="block example">
              <h4>{label(ui.example)}</h4>
              <p>{t(item.example, locale)}</p>
            </section>
            <section className="block result">
              <h4>{label(ui.result)}</h4>
              <p>{t(item.result, locale)}</p>
            </section>
          </article>
        ))}
      </div>
    </section>
  )
}
