import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { international } from '../core/tables/international'
import { encodeText } from '../core/encode'
import { callsFor, CallSign } from '../components/shell/CallSign'
import { Translator } from '../components/translator/Translator'
import { useLang } from '../state/lang'
import './pages.css'

const TAPE_SOURCE = 'MORSE WORLD LISTEN SEND LEARN'

type TapeEl = { el: 'dot' | 'dash' | 'gap'; hot: boolean }

/** Стрічка декоративна й завжди латинська — вона не має мигати від зміни таблиці. */
function buildTape(): TapeEl[] {
  const code = encodeText(TAPE_SOURCE, international, ' ', ' / ')
  const out: TapeEl[] = []
  for (const ch of code) {
    if (ch === '.') out.push({ el: 'dot', hot: false })
    else if (ch === '-') out.push({ el: 'dash', hot: false })
    else if (ch === '/') out.push({ el: 'gap', hot: true })
    else out.push({ el: 'gap', hot: false })
  }
  return out
}

const CONTENT = {
  uk: {
    heroTitle: (em: (s: string) => React.ReactNode) => (
      <>Морзянка, з якою {em('приємно')} працювати.</>
    ),
    heroLead:
      'Кодування, декодування зі звуку, ручний ключ і навчання за методом Коха. Ніша давно насичена — тут відрізняється тільки ремесло: точний тайминг, чистий звук і інтерфейс, який не заважає.',
    openTranslator: 'Відкрити перекладач',
    goToLearn: 'Перейти до навчання',
    s01: '01 — ПЕРЕКЛАДАЧ',
    s01title: 'Обидва напрями, на кожне натискання',
    s01tag: 'ЧУТНО Й ВИДНО, ЯК ЙДЕ ПЕРЕДАЧА',
    s02: '02 — ТАЙМИНГ',
    s02title: 'Числа, від яких залежить усе',
    s02lead: 'Ядро приймає числа й віддає числа. Воно не знає про DOM — і саме тому його можна перевірити тестами, а не на слух.',
    s03: '03 — МОДУЛІ',
    s03title: 'Один конвеєр, різні джерела',
    inProgress: 'В РОБОТІ',
    done: 'ГОТОВО',
    specs: [
      { value: '1200 / WPM', label: 'тривалість крапки в мілісекундах' },
      { value: '5–40', label: 'WPM, зі стисненням за Фарнсвортом' },
      { value: '< 20 мс', label: 'від натискання клавіші до звуку' },
      { value: '0', label: 'мережевих запитів після завантаження' },
    ],
    features: [
      {
        code: '.-',
        title: 'Перекладач',
        body: 'Двонаправлений, без кнопки «відправити». Напрям визначається сам, невідомий символ не ламає решту рядка.',
        to: '/',
      },
      {
        code: '-.-',
        title: 'Програвання',
        body: 'Синус 400–1000 Гц, планування через AudioContext.currentTime. Огинаюча 5 мс — жодних клацань.',
        to: '/',
      },
      {
        code: '...',
        title: 'Пісочниця',
        body: 'Ручний ключ із клавіатури, миші або тачу. Замір через performance.now(), живе декодування під час передачі.',
        to: '/practice',
      },
      {
        code: '-..',
        title: 'Мікрофон',
        body: 'Ґьорцель у AudioWorklet, автопошук частоти, адаптивний поріг із гістерезисом. Звук нікуди не передається.',
        to: '/decoder',
        soon: true,
      },
      {
        code: '..-.',
        title: 'Файл',
        body: 'Той самий конвеєр, інше джерело. WAV, MP3, OGG, M4A до 20 МБ — обробка у воркері з прогресом.',
        to: '/decoder',
        soon: true,
      },
      {
        code: '-.-.',
        title: 'Метод Коха',
        body: 'Повна швидкість символів із першого уроку. Росте кількість літер, а не темп. Статистика по кожній літері.',
        to: '/learn',
      },
    ],
  },
  en: {
    heroTitle: (em: (s: string) => React.ReactNode) => (
      <>Morse code that's {em('nice')} to work with.</>
    ),
    heroLead:
      'Encoding, decoding from sound, a straight key, and lessons using the Koch method. The niche is long saturated — the only thing that differs here is craft: exact timing, clean sound, and an interface that stays out of your way.',
    openTranslator: 'Open the translator',
    goToLearn: 'Go to lessons',
    s01: '01 — TRANSLATOR',
    s01title: 'Both directions, on every keystroke',
    s01tag: 'YOU CAN HEAR AND SEE THE TRANSMISSION',
    s02: '02 — TIMING',
    s02title: 'The numbers everything depends on',
    s02lead: "The core takes numbers and returns numbers. It knows nothing about the DOM — which is exactly why it can be tested, not just listened to.",
    s03: '03 — MODULES',
    s03title: 'One pipeline, different sources',
    inProgress: 'IN PROGRESS',
    done: 'DONE',
    specs: [
      { value: '1200 / WPM', label: 'dot length in milliseconds' },
      { value: '5–40', label: 'WPM, with Farnsworth spacing' },
      { value: '< 20 ms', label: 'from keypress to sound' },
      { value: '0', label: 'network requests after load' },
    ],
    features: [
      {
        code: '.-',
        title: 'Translator',
        body: 'Two-way, no "send" button. Direction is detected automatically, an unknown symbol never breaks the rest of the line.',
        to: '/',
      },
      {
        code: '-.-',
        title: 'Playback',
        body: 'A 400–1000 Hz sine tone, scheduled via AudioContext.currentTime. A 5 ms envelope — no clicks.',
        to: '/',
      },
      {
        code: '...',
        title: 'Sandbox',
        body: 'A straight key from keyboard, mouse, or touch. Timed with performance.now(), decoded live as you send.',
        to: '/practice',
      },
      {
        code: '-..',
        title: 'Microphone',
        body: 'Goertzel in an AudioWorklet, automatic frequency search, adaptive threshold with hysteresis. Audio never leaves the device.',
        to: '/decoder',
        soon: true,
      },
      {
        code: '..-.',
        title: 'File',
        body: 'The same pipeline, a different source. WAV, MP3, OGG, M4A up to 20 MB — processed in a worker with progress.',
        to: '/decoder',
        soon: true,
      },
      {
        code: '-.-.',
        title: 'Koch method',
        body: 'Full character speed from lesson one. The number of letters grows, not the tempo. Per-letter statistics.',
        to: '/learn',
      },
    ],
  },
} as const

export function Home() {
  const tape = useMemo(buildTape, [])
  const { lang } = useLang()
  const c = CONTENT[lang]

  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="hero">
        <div className="hero__grid" aria-hidden="true" />
        <div className="shell hero__inner">
          <CallSign morse={callsFor(lang).home.morse} label={callsFor(lang).home.label} hero />

          <h1 className="display hero__title">{c.heroTitle((s) => <em>{s}</em>)}</h1>

          <p className="lead">{c.heroLead}</p>

          <div className="hero__cta">
            <a className="btn btn--accent" href="#translator">
              {c.openTranslator}
            </a>
            <Link className="btn btn--ghost" to="/learn">
              {c.goToLearn}
            </Link>
          </div>
        </div>

        <div className="hero__tape" aria-hidden="true">
          <div className="hero__tape-track">
            {[...tape, ...tape].map((t, i) => (
              <i key={i} data-el={t.el} data-hot={t.hot ? '' : undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- translator ---------------- */}
      <section className="section" id="translator">
        <div className="shell">
          <div className="section__head">
            <div>
              <span className="micro">{c.s01}</span>
              <h2 className="h2" style={{ marginTop: 'var(--s-3)' }}>
                {c.s01title}
              </h2>
            </div>
            <span className="micro">{c.s01tag}</span>
          </div>

          <Translator />
        </div>
      </section>

      {/* ---------------- specs ---------------- */}
      <section className="section">
        <div className="shell">
          <div className="section__head">
            <div>
              <span className="micro">{c.s02}</span>
              <h2 className="h2" style={{ marginTop: 'var(--s-3)' }}>
                {c.s02title}
              </h2>
            </div>
            <p className="lead" style={{ maxWidth: '32rem' }}>
              {c.s02lead}
            </p>
          </div>

          <div className="specs">
            {c.specs.map((s) => (
              <div className="spec" key={s.label}>
                <b className="mono">{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- features ---------------- */}
      <section className="section">
        <div className="shell">
          <div className="section__head">
            <div>
              <span className="micro">{c.s03}</span>
              <h2 className="h2" style={{ marginTop: 'var(--s-3)' }}>
                {c.s03title}
              </h2>
            </div>
            <span className="micro">TEXT ↔ SYMBOLS ↔ PLAYSTEP[] ↔ SIGNAL</span>
          </div>

          <div className="feats">
            {c.features.map((f) => (
              <Link
                to={f.to}
                className="card feat"
                key={f.title}
                data-soon={'soon' in f && f.soon ? '' : undefined}
              >
                <span className="feat__code mono">{f.code}</span>
                <h3 className="h3">{f.title}</h3>
                <p>{f.body}</p>
                <span className="micro">{'soon' in f && f.soon ? c.inProgress : c.done}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
