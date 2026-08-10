import { Link } from 'react-router-dom'

import { callsFor } from '../components/shell/CallSign'
import { Rich } from '../i18n/rich'
import { useLang } from '../state/lang'
import { PageHead } from './PageHead'
import { AboutNav } from './aboutNav'
import './pages.css'

const CONTENT = {
  uk: {
    title: 'Джерела таблиць',
    lead: 'Морзянка — це не одна таблиця. Для кожної тут вказано, звідки взято коди: якщо інструменту довіряють тайминг, він мусить показувати й походження самих знаків.',
    s01: '01 — ЧОМУ ТАБЛИЦЮ ВИБИРАЮТЬ ВРУЧНУ',
    s01title: 'Автоматично вгадати її неможливо',
    s01p1: 'Латиниця й кирилиця масово збігаються за кодами: `.-` — це і **A**, і **А**. Через це визначити таблицю під час декодування автоматично неможливо в принципі, і вона завжди вибирається явно — перемикач стоїть над полем вводу, а не мовчазний вибір за вас.',
    s01p2: 'Напрям — інша річ: його сайт визначає сам, бо морзянка в полі тексту однозначно означає запит на розшифровку. А от абетку з самих крапок і тире не вивести.',
    s02: '02 — ЩО В СИСТЕМІ',
    s02title: 'Дві таблиці, і кожна зі своїм станом звірки',
    tables: [
      {
        id: 'international',
        name: 'International',
        note: 'ITU-R M.1677-1. Латиниця A–Z, цифри, розділові знаки. Основна, стоїть за замовчуванням.',
        state: 'РЕКОМЕНДАЦІЮ ВИЗНАЧЕНО, ПОСИЛАННЯ ДОДАТИ',
      },
      {
        id: 'cyrillic',
        name: 'Кирилична (базова)',
        note: 'Та частина, що збігається для української, російської та болгарської. Літери, які в цих мовах розходяться, сюди не входять.',
        state: 'ДЖЕРЕЛО НЕ ЗАФІКСОВАНЕ',
      },
    ],
    s02p: 'Обидві працюють, але жодна ще не має посилання на першоджерело — тому в `SOURCES.md` вони стоять із позначкою «звірити». Написати тут «обидві звірені» було б рівно тією неточністю, від якої цей розділ і має захищати.',
    allCodes: 'Усі коди можна подивитися в ',
    chartLink: 'таблиці символів',
    more: 'ЩЕ ПРО ПРОЄКТ',
  },
  en: {
    title: 'Table sources',
    lead: 'Morse code is not one table. For each of them this page states where the codes came from: if a tool is trusted with the timing, it must also show the provenance of the signs themselves.',
    s01: '01 — WHY THE TABLE IS PICKED BY HAND',
    s01title: 'Guessing it automatically is impossible',
    s01p1: 'Latin and Cyrillic overlap heavily by code: `.-` is both **A** and **А**. Determining the table while decoding is therefore impossible in principle, and it is always chosen explicitly — the switch sits above the input field, rather than a silent choice made for you.',
    s01p2: 'Direction is a different matter: the site works that out itself, because Morse in the text field unambiguously means a request to decode. The alphabet, though, cannot be derived from dots and dashes alone.',
    s02: '02 — WHAT IS IN THE SYSTEM',
    s02title: 'Two tables, each with its own verification status',
    tables: [
      {
        id: 'international',
        name: 'International',
        note: 'ITU-R M.1677-1. Latin A–Z, digits, punctuation. The primary one, selected by default.',
        state: 'RECOMMENDATION IDENTIFIED, LINK STILL TO ADD',
      },
      {
        id: 'cyrillic',
        name: 'Cyrillic (base)',
        note: 'The part shared by Ukrainian, Russian and Bulgarian. Letters that diverge between those languages are not included.',
        state: 'SOURCE NOT PINNED DOWN',
      },
    ],
    s02p: 'Both work, but neither has a link to a primary source yet — which is why `SOURCES.md` marks them "to check". Writing "both verified" here would be exactly the kind of inaccuracy this section exists to prevent.',
    allCodes: 'Every code can be viewed in the ',
    chartLink: 'character chart',
    more: 'MORE ABOUT THE PROJECT',
  },
} as const

export function AboutSources() {
  const { lang } = useLang()
  const c = CONTENT[lang]

  return (
    <div className="page shell">
      <PageHead call={callsFor(lang).aboutSources} title={c.title} lead={c.lead} />

      <div className="about">
        <section className="about-sec">
          <span className="micro about-sec__label">{c.s01}</span>
          <h2 className="h2">{c.s01title}</h2>
          <div className="prose">
            <p>
              <Rich text={c.s01p1} />
            </p>
            <p>
              <Rich text={c.s01p2} />
            </p>
          </div>
        </section>

        <section className="about-sec">
          <span className="micro about-sec__label">{c.s02}</span>
          <h2 className="h2">{c.s02title}</h2>

          <dl className="sheet">
            {c.tables.map((table) => (
              <div className="sheet__row" key={table.id}>
                <dt className="micro">{table.id}</dt>
                <dd>
                  <b>{table.name}</b> — {table.note} <span className="micro">· {table.state}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="prose">
            <p>
              <Rich text={c.s02p} />
            </p>
            <p>
              {c.allCodes}
              <Link to="/chart" style={{ textDecoration: 'underline' }}>
                {c.chartLink}
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="about-sec">
          <span className="micro about-sec__label">{c.more}</span>
          <AboutNav />
        </section>
      </div>
    </div>
  )
}
