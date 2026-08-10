import { NavLink, useLocation } from 'react-router-dom'
import { useLang } from '../../state/lang'
import './shell.css'

/**
 * Нижня сигнальна панель — постійний елемент інтерфейсу.
 * Шкала WPM тут поки декоративна: реальні значення підключаються разом із ядром.
 */

const STOPS = {
  uk: [
    { to: '/', wpm: '05', label: 'ПЕРЕКЛАД' },
    { to: '/decoder', wpm: '12', label: 'ДЕКОДЕР' },
    { to: '/practice', wpm: '20', label: 'ПІСОЧНИЦЯ' },
    { to: '/learn', wpm: '28', label: 'КОХ' },
    { to: '/chart', wpm: '40', label: 'ТАБЛИЦЯ' },
  ],
  en: [
    { to: '/', wpm: '05', label: 'TRANSLATE' },
    { to: '/decoder', wpm: '12', label: 'DECODER' },
    { to: '/practice', wpm: '20', label: 'SANDBOX' },
    { to: '/learn', wpm: '28', label: 'KOCH' },
    { to: '/chart', wpm: '40', label: 'CHART' },
  ],
} as const

const STRINGS = {
  uk: { replay: 'Програти запуск заново', rescan: 'Ре-скан', learn: 'Вчити' },
  en: { replay: 'Play the boot sequence again', rescan: 'Re-scan', learn: 'Learn' },
} as const

/** До перекладача веде зупинка «05 ПЕРЕКЛАД» — дублювати її кнопкою не треба. */
type Props = { onReplayBoot: () => void }

export function SignalBar({ onReplayBoot }: Props) {
  const { pathname } = useLocation()
  const { lang } = useLang()
  const t = STRINGS[lang]

  return (
    <div className="sigbar">
      <div className="sigbar__inner shell">
        <span className="sigbar__knob" aria-hidden="true" />

        <span className="sigbar__id">
          <b>MW—600</b>
          <span className="micro">SINE · 600 Hz</span>
        </span>

        <div className="sigbar__ruler" aria-hidden="true">
          <div className="sigbar__ticks">
            {Array.from({ length: 49 }, (_, i) => (
              <i key={i} data-major={i % 12 === 0 ? '' : undefined} />
            ))}
          </div>
          <div className="sigbar__stops">
            {STOPS[lang].map((s) => (
              <NavLink
                key={s.to}
                to={s.to}
                className="sigbar__stop"
                data-active={pathname === s.to ? '' : undefined}
              >
                <b>{s.wpm}</b>
                <span className="micro">{s.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="sigbar__actions">
          <button className="btn btn--ghost btn--pill" onClick={onReplayBoot} title={t.replay}>
            <span className="micro">{t.rescan}</span>
          </button>
          <NavLink to="/learn" className="btn btn--accent btn--pill">
            {t.learn}
          </NavLink>
        </div>
      </div>
    </div>
  )
}
