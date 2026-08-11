import { Link } from 'react-router-dom'
import { callsFor } from '../components/shell/CallSign'
import { Rich } from '../i18n/rich'
import { useLang } from '../state/lang'
import { PageHead } from './PageHead'
import { AboutNav } from './aboutNav'
import './pages.css'

const CONTENT = {
  uk: {
    title: 'Про проєкт',
    lead: 'MorseWorld — інструмент для роботи з азбукою Морзе: перекласти, почути, відстукати вручну й навчитися приймати на слух. Усе рахується у вашому браузері: без сервера й без реєстрації.',
    sheet: [
      {
        label: 'СТАТУС',
        value:
          'Працюють перекладач, звук, таблиця символів, пісочниця з ручним ключем, уроки за методом Коха й читання текстів. Декодер із мікрофона та з аудіофайлу — наступний етап.',
      },
      { label: 'СТЕК', value: 'TypeScript у строгому режимі, Vite, React, Web Audio API, AudioWorklet для DSP.' },
      { label: 'АРХІТЕКТУРА', value: 'Ядро в `/src/core` не імпортує нічого браузерного — приймає числа, віддає числа.' },
      { label: 'ДЕ ПРАЦЮЄ', value: 'Chrome і Edge 113+, Firefox 141+, Safari 17+. Офлайн після першого відвідування.' },
      { label: 'ДАНІ', value: 'Ваші — нікуди не йдуть: ні акаунтів, ні синхронізації. Назовні йде лише лічильник відвідувань сторінок.' },
    ],
    can: [
      { code: '.-', text: 'Перекладати текст у морзе й назад, у обидва боки, на кожне натискання клавіші' },
      { code: '-.-', text: 'Програвати код звуком, спалахом екрана й вібрацією; зберігати як WAV' },
      { code: '...', text: 'Приймати ручний ключ з клавіатури, миші або тачу — і читати його наживо' },
      { code: '-..', text: 'Декодувати чистий тон із мікрофона або аудіофайлу' },
      {
        code: '-.-.',
        text: 'Вчити за методом Коха: знайомство зі звуком, приймання на слух і передавання рукою — зі статистикою по кожній літері окремо в обидва боки',
      },
    ],
    s01: '01 — НАВІЩО ЩЕ ОДИН',
    s01title: 'Ніша насичена, але якісного я не знайшов',
    s01p1: 'Перекладачів морзянки в мережі десятки, і майже всі вміють те саме. Якісного серед них я не знайшов — тому спробував зробити своє.',
    s02: '02 — МЕЖІ ПЕРШОЇ ВЕРСІЇ',
    s02title: 'Що входить',
    s03: '03 — ТЕКСТИ ДЛЯ ЧИТАННЯ',
    s03title: 'Тільки суспільне надбання',
    s03p1: "Для тренування на зв'язних текстах беруться твори, автори яких померли понад сімдесят років тому — з Project Gutenberg. Кожен текст супроводжується джерелом і ліцензією, лежить у репозиторії статичним файлом і не підвантажується з чужих сайтів під час роботи.",
    s03p2before: 'Побачити їх можна на сторінці ',
    s03p2mid: ', а всі коди — у ',
    s03p2after: '.',
    readingLink: 'читання текстів',
    chartLink: 'таблиці символів',
    more: 'ЩЕ ПРО ПРОЄКТ',
  },
  en: {
    title: 'About',
    lead: 'MorseWorld is a tool for working with Morse code: translate it, hear it, key it by hand, and learn to copy it by ear. Everything runs in your browser — no server and no account.',
    sheet: [
      {
        label: 'STATUS',
        value:
          'The translator, audio, the character chart, the sandbox with the straight key, the Koch method lessons, and reading texts all work. A microphone and audio-file decoder are next.',
      },
      { label: 'STACK', value: 'TypeScript in strict mode, Vite, React, Web Audio API, AudioWorklet for DSP.' },
      { label: 'ARCHITECTURE', value: 'The core in `/src/core` imports nothing from the browser — it takes numbers and returns numbers.' },
      { label: 'WHERE IT RUNS', value: 'Chrome and Edge 113+, Firefox 141+, Safari 17+. Offline after the first visit.' },
      { label: 'DATA', value: 'Yours goes nowhere: no accounts, no sync. Only page views are counted.' },
    ],
    can: [
      { code: '.-', text: 'Translate text to Morse and back, both ways, on every keystroke' },
      { code: '-.-', text: 'Play the code as sound, a screen flash, and vibration; save it as WAV' },
      { code: '...', text: 'Take a straight key from keyboard, mouse or touch — and decode it live' },
      { code: '-..', text: 'Decode a clean tone from the microphone or an audio file' },
      {
        code: '-.-.',
        text: 'Teach with the Koch method: getting to know the sound, copying by ear, and sending by hand — with separate per-letter statistics for both',
      },
    ],
    s01: '01 — WHY ANOTHER ONE',
    s01title: 'The niche is saturated, but I found nothing good in it',
    s01p1: 'There are dozens of Morse translators online, and almost all of them do the same things. I found none of them good — so I tried to build my own.',
    s02: '02 — SCOPE OF THE FIRST VERSION',
    s02title: 'What is in',
    s03: '03 — READING TEXTS',
    s03title: 'Public domain only',
    s03p1: 'Practice texts are drawn from works whose authors died more than seventy years ago — from Project Gutenberg. Each text carries its source and licence, lives in the repository as a static file, and is never fetched from another site at runtime.',
    s03p2before: 'You can find them on the ',
    s03p2mid: ' page, and every code in the ',
    s03p2after: '.',
    readingLink: 'reading texts',
    chartLink: 'character chart',
    more: 'MORE ABOUT THE PROJECT',
  },
} as const

export function About() {
  const { lang } = useLang()
  const c = CONTENT[lang]

  return (
    <div className="page shell">
      <PageHead call={callsFor(lang).about} title={c.title} lead={c.lead} />

      <div className="about">
        {/* ---------- паспорт ---------- */}
        <dl className="sheet">
          {c.sheet.map((row) => (
            <div className="sheet__row" key={row.label}>
              <dt className="micro">{row.label}</dt>
              <dd>
                <Rich text={row.value} />
              </dd>
            </div>
          ))}
        </dl>

        {/* ---------- навіщо ---------- */}
        <section className="about-sec">
          <span className="micro about-sec__label">{c.s01}</span>
          <h2 className="h2">{c.s01title}</h2>
          <div className="prose">
            <p>{c.s01p1}</p>
          </div>
        </section>

        {/* ---------- межі ---------- */}
        <section className="about-sec">
          <span className="micro about-sec__label">{c.s02}</span>
          <h2 className="h2">{c.s02title}</h2>
          {/* Колонки більше немає, тому й підзаголовок «ВХОДИТЬ» зник: він
              існував тільки щоб відрізняти її від «поза межами», а поруч із
              заголовком «Що входить» просто повторював його вдруге. */}
          <ul className="plist">
            {c.can.map((i) => (
              <li key={i.text} data-code={i.code}>
                {i.text}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- тексти ---------- */}
        <section className="about-sec">
          <span className="micro about-sec__label">{c.s03}</span>
          <h2 className="h2">{c.s03title}</h2>
          <div className="prose">
            <p>{c.s03p1}</p>
            <p>
              {c.s03p2before}
              <Link to="/learn/reading" style={{ textDecoration: 'underline' }}>
                {c.readingLink}
              </Link>
              {c.s03p2mid}
              <Link to="/chart" style={{ textDecoration: 'underline' }}>
                {c.chartLink}
              </Link>
              {c.s03p2after}
            </p>
          </div>
        </section>

        {/* Перемикач лежить в кінці — так само, як на трьох інших сторінках
            набору. Одне місце на всіх чотирьох адресах, щоб його не шукати. */}
        <section className="about-sec">
          <span className="micro about-sec__label">{c.more}</span>
          <AboutNav />
        </section>
      </div>
    </div>
  )
}
