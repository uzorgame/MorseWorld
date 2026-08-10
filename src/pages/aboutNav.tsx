import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../state/lang'
import './pages.css'

/**
 * Чотири сторінки «Про проєкт» — окремі адреси, звʼязані спільним перемикачем.
 *
 * Огляд стоїть у цьому ж списку навмисно: інакше з трьох розділів не було б
 * прямого шляху назад, і четверта адреса випадала б із набору.
 */
const ABOUT_PAGES = {
  uk: [
    {
      to: '/about',
      code: '−·· ·',
      title: 'Про проєкт',
      body: 'Огляд: статус, стек, що входить у першу версію, а що свідомо ні.',
    },
    {
      to: '/about/how',
      code: '−··',
      title: 'Як влаштовано',
      body: 'Одне представлення сигналу, до якого зводяться всі джерела.',
    },
    {
      to: '/about/sources',
      code: '···−',
      title: 'Джерела таблиць',
      body: 'Звідки взято кожен код і що ще потребує звірки.',
    },
    {
      to: '/about/privacy',
      code: '·−·−',
      title: 'Приватність',
      body: 'Чому нуль мережевих запитів — це властивість, а не обіцянка.',
    },
  ],
  en: [
    {
      to: '/about',
      code: '−·· ·',
      title: 'About',
      body: 'Overview: status, stack, what is in the first version and what deliberately is not.',
    },
    {
      to: '/about/how',
      code: '−··',
      title: 'How it works',
      body: 'One signal representation that every source is reduced to.',
    },
    {
      to: '/about/sources',
      code: '···−',
      title: 'Table sources',
      body: 'Where every code comes from, and what still needs checking.',
    },
    {
      to: '/about/privacy',
      code: '·−·−',
      title: 'Privacy',
      body: 'Why zero network requests is a property, not a promise.',
    },
  ],
} as const

const STRINGS = {
  uk: { nav: 'Розділи про проєкт', here: 'ВИ ТУТ', read: 'ЧИТАТИ' },
  en: { nav: 'About sections', here: 'YOU ARE HERE', read: 'READ' },
} as const

/** Поточна сторінка лишається в рядку — так видно, де ви й куди ще можна піти. */
export function AboutNav() {
  const { pathname } = useLocation()
  const { lang } = useLang()
  const t = STRINGS[lang]

  return (
    <nav className="about-nav" aria-label={t.nav}>
      {ABOUT_PAGES[lang].map((page) => {
        const here = pathname === page.to
        return (
          <Link
            to={page.to}
            key={page.to}
            className="card feat about-nav__item"
            data-here={here ? '' : undefined}
            aria-current={here ? 'page' : undefined}
          >
            <span className="feat__code mono">{page.code}</span>
            <h3 className="h3">{page.title}</h3>
            <p>{page.body}</p>
            <span className="micro">{here ? t.here : t.read}</span>
          </Link>
        )
      })}
    </nav>
  )
}
