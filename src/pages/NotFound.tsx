import { Link } from 'react-router-dom'
import { useLang } from '../state/lang'
import './pages.css'

const STRINGS = {
  uk: {
    badge: '........ — ПОМИЛКА',
    lead: 'Вісім крапок поспіль — це просигнал «помилка». Сторінки за цією адресою немає.',
    home: 'На головну',
  },
  en: {
    badge: '........ — ERROR',
    lead: 'Eight dots in a row is the "error" prosign. There is no page at this address.',
    home: 'Go home',
  },
} as const

export function NotFound() {
  const { lang } = useLang()
  const t = STRINGS[lang]

  return (
    <div className="page shell">
      <div className="page__head">
        <span className="page__badge micro">{t.badge}</span>
        <h1 className="display">404</h1>
        <p className="lead">{t.lead}</p>
        <Link className="btn btn--accent" to="/" style={{ width: 'fit-content' }}>
          {t.home}
        </Link>
      </div>
    </div>
  )
}
