import { useMemo, useState, type CSSProperties } from 'react'
import { APPS } from '../data/apps'
import { shortcuts } from '../data/shortcuts'
import { t } from '../i18n/ui'
import { formatKeys } from '../lib/detect'
import { useApp } from '../context/AppContext'
import { ui } from '../i18n/ui'
import { KeyCombo } from '../components/KeyCombo'
import type { Shortcut } from '../types'

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickQuestion(pool: Shortcut[], previousId?: string): Shortcut {
  const usable = pool.filter((s) => s.id !== previousId)
  return usable[Math.floor(Math.random() * usable.length)] ?? pool[0]
}

export function QuizView() {
  const { os, locale, appId, label } = useApp()
  const pool = useMemo(
    () => shortcuts.filter((s) => (appId === 'all' ? true : s.appId === appId)),
    [appId],
  )
  const [current, setCurrent] = useState(() => pickQuestion(pool))
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState({ ok: 0, total: 0 })

  const options = useMemo(() => {
    const correct = formatKeys(current.keys[os])
    const decoys = shuffle(
      pool
        .filter((s) => s.id !== current.id)
        .map((s) => formatKeys(s.keys[os]))
        .filter((k, i, arr) => k !== correct && arr.indexOf(k) === i),
    ).slice(0, 3)
    return shuffle([correct, ...decoys])
  }, [current, os, pool])

  const correct = formatKeys(current.keys[os])
  const answered = picked !== null
  const accent = APPS.find((a) => a.id === current.appId)?.color ?? '#8b93a7'

  function choose(option: string) {
    if (picked) return
    setPicked(option)
    setScore((s) => ({
      ok: s.ok + (option === correct ? 1 : 0),
      total: s.total + 1,
    }))
  }

  function next() {
    setPicked(null)
    setCurrent(pickQuestion(pool, current.id))
  }

  return (
    <section className="stack quiz">
      <header className="view-head">
        <h2>{label(ui.quiz)}</h2>
        <p>{label(ui.quizLead)}</p>
        <p className="score">
          {label(ui.quizScore)}: {score.ok}/{score.total}
        </p>
      </header>
      <article className="quiz-card" style={{ '--accent': accent } as CSSProperties}>
        <p className="crumbs">{t(current.title, locale)}</p>
        <h3>{label(ui.quizQuestion)}</h3>
        <p>{t(current.description, locale)}</p>
        <div className="quiz-options">
          {options.map((option) => {
            const state =
              !answered ? '' : option === correct ? 'good' : option === picked ? 'bad' : ''
            return (
              <button
                key={option}
                type="button"
                className={`opt ${state}`}
                onClick={() => choose(option)}
              >
                <KeyCombo keys={option.split(' + ')} />
              </button>
            )
          })}
        </div>
        {answered && (
          <div className="quiz-feedback">
            <strong>{picked === correct ? label(ui.quizCorrect) : label(ui.quizWrong)}</strong>
            <p>
              {label(ui.result)}: {t(current.result, locale)}
            </p>
            <div className="modal-actions">
              <button type="button" className="primary" onClick={next}>
                {label(ui.quizNext)}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setScore({ ok: 0, total: 0 })
                  next()
                }}
              >
                {label(ui.quizRestart)}
              </button>
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
