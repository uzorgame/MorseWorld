import { Link } from 'react-router-dom'
import { useLang } from '../../state/lang'
import { LangSwitch } from './LangSwitch'
import './shell.css'

const STRINGS = {
  uk: {
    note: 'Повністю клієнтський інструмент. Після завантаження сторінки — жодного мережевого запиту. Звук, мікрофон і прогрес не покидають ваш пристрій.',
    tools: 'Інструменти',
    translator: 'Перекладач',
    decoder: 'Декодер',
    practice: 'Пісочниця',
    learning: 'Навчання',
    koch: 'Метод Коха',
    reading: 'Читання текстів',
    chart: 'Таблиця символів',
    project: 'Проєкт',
    about: 'Про проєкт',
    how: 'Як влаштовано',
    sources: 'Джерела таблиць',
    privacy: 'Приватність',
    colophon: 'ITU-R M.1677-1 · Слова — суспільне надбання · 2026',
    author: 'Автор · дивитись портфоліо',
  },
  en: {
    note: 'A fully client-side tool. After the page loads — no network requests at all. Audio, the microphone and your progress never leave your device.',
    tools: 'Tools',
    translator: 'Translator',
    decoder: 'Decoder',
    practice: 'Sandbox',
    learning: 'Learn',
    koch: 'Koch method',
    reading: 'Reading texts',
    chart: 'Character chart',
    project: 'Project',
    about: 'About',
    how: 'How it works',
    sources: 'Table sources',
    privacy: 'Privacy',
    colophon: 'ITU-R M.1677-1 · Words are public domain · 2026',
    author: 'Author · see portfolio',
  },
} as const

export function SiteFooter() {
  const { lang } = useLang()
  const t = STRINGS[lang]

  return (
    <footer className="ftr">
      <div className="shell">
        <div className="ftr__grid">
          <div className="ftr__col">
            <span className="micro">MORSEWORLD</span>
            <p className="ftr__note">{t.note}</p>
          </div>

          <div className="ftr__col">
            <span className="micro">{t.tools}</span>
            <Link to="/">{t.translator}</Link>
            <Link to="/decoder">{t.decoder}</Link>
            <Link to="/practice">{t.practice}</Link>
          </div>

          <div className="ftr__col">
            <span className="micro">{t.learning}</span>
            <Link to="/learn">{t.koch}</Link>
            <Link to="/learn/reading">{t.reading}</Link>
            <Link to="/chart">{t.chart}</Link>
          </div>

          <div className="ftr__col">
            <span className="micro">{t.project}</span>
            <Link to="/about">{t.about}</Link>
            <Link to="/about/how">{t.how}</Link>
            <Link to="/about/sources">{t.sources}</Link>
            <Link to="/about/privacy">{t.privacy}</Link>
          </div>
        </div>

        <div className="ftr__base">
          <span className="micro">{t.colophon}</span>

          <div className="ftr__right">
            <LangSwitch />

            <a
              className="author"
              href="https://uz-or.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="author__mark" aria-hidden="true">
                <i data-el="dash" />
                <i data-el="dot" />
              </span>
              <span className="author__body">
                <b>Mykhailo Nahreba</b>
                <span className="micro">{t.author}</span>
              </span>
              <span className="author__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
