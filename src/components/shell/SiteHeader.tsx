import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { scrollToSelector } from '../../lib/scroll'
import { requestTranslator } from '../../lib/translatorIntent'
import { useLang } from '../../state/lang'
import { useTable } from '../../state/table'
import { navFor, type MegaLink } from './megaNav'
import './shell.css'

const STRINGS = {
  uk: {
    home: 'MorseWorld — на головну',
    nav: 'Основна навігація',
    /* Коротко, і це не косметика: «Перейти до навчання» на вузькому екрані
       виштовхувало кнопку меню за край, а разом із нею й усю сторінку — її
       ставало можливо тягнути вбік. Англійське «Lessons» вкладалося, українське
       — ні, тому мірка тут довжина, а не переклад слово в слово. */
    cta: 'Навчання',
    menu: 'Меню',
    soon: 'СКОРО',
  },
  en: {
    home: 'MorseWorld — home',
    nav: 'Main navigation',
    cta: 'Lessons',
    menu: 'Menu',
    soon: 'SOON',
  },
} as const

export function SiteHeader() {
  const [drawer, setDrawer] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const [height, setHeight] = useState(0)

  const { lang } = useLang()
  const t = STRINGS[lang]
  const NAV = navFor(lang)
  const { setTableId } = useTable()
  const panels = useRef<(HTMLDivElement | null)[]>([])
  const openTimer = useRef<number | undefined>(undefined)
  const closeTimer = useRef<number | undefined>(undefined)
  const { pathname } = useLocation()

  // Висоту знімаємо до малювання, інакше панель встигне блимнути в старому розмірі.
  useLayoutEffect(() => {
    if (open === null) return
    const el = panels.current[open]
    if (el) setHeight(el.offsetHeight)
  }, [open])

  const clearTimers = useCallback(() => {
    window.clearTimeout(openTimer.current)
    window.clearTimeout(closeTimer.current)
  }, [])

  /** Перше відкриття — із паузою, щоб панель не вискакувала на проліт мишею.
   *  Перехід між пунктами, коли вона вже відкрита, — миттєвий. */
  const enter = useCallback(
    (i: number) => {
      clearTimers()
      if (open !== null) setOpen(i)
      else openTimer.current = window.setTimeout(() => setOpen(i), 90)
    },
    [clearTimers, open],
  )

  const leave = useCallback(() => {
    clearTimers()
    closeTimer.current = window.setTimeout(() => setOpen(null), 160)
  }, [clearTimers])

  const close = useCallback(() => {
    clearTimers()
    setOpen(null)
  }, [clearTimers])

  /**
   * Пункт меню може не просто вести на сторінку, а вмикати режим у перекладачі.
   * Якщо ми вже на головній, роутер на той самий хеш не зреагує — доїжджаємо самі.
   */
  const pick = useCallback(
    (link: MegaLink) => {
      if (link.intent) requestTranslator(link.intent)
      if (link.table) setTableId(link.table)

      // Роутер не зреагує на перехід у той самий маршрут — доїжджаємо самі.
      const [rawPath = '', hash] = link.to.split('#')
      const target = rawPath.replace(/\/$/, '') || '/'
      if (hash && pathname === target) scrollToSelector(`#${hash}`)

      close()
    },
    [pathname, close, setTableId],
  )

  useEffect(() => clearTimers, [clearTimers])

  useEffect(() => {
    setDrawer(false)
    close()
  }, [pathname, close])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <header className="hdr" onMouseLeave={leave}>
      <div className="hdr__inner shell">
        <NavLink to="/" className="hdr__brand" aria-label={t.home}>
          <span className="hdr__mark" aria-hidden="true">
            <i data-el="dash" />
            <i data-el="dash" />
            <i data-el="dot" />
          </span>
          <span className="hdr__word">MorseWorld</span>
        </NavLink>

        <nav className="hdr__nav" aria-label={t.nav}>
          {NAV.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="hdr__link"
              data-open={i === open ? '' : undefined}
              aria-expanded={i === open}
              onMouseEnter={() => enter(i)}
              onFocus={() => enter(i)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hdr__actions">
          <NavLink to="/learn" className="btn btn--primary">
            {t.cta}
          </NavLink>
          <button
            className="hdr__burger"
            aria-expanded={drawer}
            aria-label={t.menu}
            onClick={() => setDrawer((v) => !v)}
          >
            <span className="micro">{drawer ? '×' : '≡'}</span>
          </button>
        </div>
      </div>

      {/* ---------- випадна панель ---------- */}
      <div
        className="mega"
        data-open={open !== null ? '' : undefined}
        onMouseEnter={clearTimers}
      >
        <div className="mega__shell" style={{ height: height ? `${height}px` : undefined }}>
          {NAV.map((item, i) => (
            <div
              key={item.to}
              className="mega__panel"
              ref={(el) => {
                panels.current[i] = el
              }}
              data-active={i === open ? '' : undefined}
              aria-hidden={i !== open}
            >
              <div className="mega__col">
                <span className="micro">{item.menu.label}</span>
                <div className="mega__links">
                  {item.menu.links.map((l) => (
                    <NavLink
                      key={l.title}
                      to={l.to}
                      className="mega__link"
                      tabIndex={i === open ? undefined : -1}
                      onClick={() => pick(l)}
                    >
                      <span className="mega__code mono">{l.code}</span>
                      <span className="mega__text">
                        <b>
                          {l.title}
                          {l.soon && <i className="micro mega__soon">{t.soon}</i>}
                        </b>
                        <span>{l.body}</span>
                      </span>
                    </NavLink>
                  ))}
                </div>
              </div>

              <aside className="mega__note">
                <span className="micro">{item.menu.note.label}</span>
                <b className="h3">{item.menu.note.title}</b>
                <p>{item.menu.note.body}</p>
              </aside>
            </div>
          ))}
        </div>
      </div>

      {drawer && (
        <div className="hdr__drawer">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
