import { useLang, type Lang } from '../../state/lang'
import './shell.css'

/** Порядок у переліку — англійська перша: вона основна мова сайту. */
const LABELS: Record<Lang, { short: string; title: string }> = {
  en: { short: 'EN', title: 'English' },
  uk: { short: 'UA', title: 'Українська' },
}

const NOTE = { uk: 'МОВА ІНТЕРФЕЙСУ', en: 'INTERFACE LANGUAGE' } as const
const ARIA = { uk: 'Мова інтерфейсу', en: 'Interface language' } as const

/** Мова інтерфейсу. Перемикає весь сайт. */
export function LangSwitch() {
  const { lang, setLang } = useLang()

  return (
    <div className="lsw" role="group" aria-label={ARIA[lang]}>
      <span className="micro lsw__note">{NOTE[lang]}</span>
      <div className="lsw__set">
        {(Object.keys(LABELS) as Lang[]).map((id) => (
          <button
            key={id}
            type="button"
            className="lsw__opt micro"
            data-active={id === lang ? '' : undefined}
            aria-pressed={id === lang}
            title={LABELS[id].title}
            lang={id}
            onClick={() => setLang(id)}
          >
            {LABELS[id].short}
          </button>
        ))}
      </div>
    </div>
  )
}
