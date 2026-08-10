import { callsFor } from '../components/shell/CallSign'
import { Rich } from '../i18n/rich'
import { useLang } from '../state/lang'
import { PageHead } from './PageHead'
import { AboutNav } from './aboutNav'
import './pages.css'

const CONTENT = {
  uk: {
    title: 'Як влаштовано',
    lead: 'Усе всередині зводиться до одного представлення сигналу. Мікрофон, аудіофайл, ручний ключ і текстове поле — це різні адаптери до нього, а не окремі підсистеми.',
    s01: '01 — КОНВЕЄР',
    s01title: 'Одне представлення, різні джерела',
    s01p: 'Усе всередині зводиться до одного типу — послідовності кроків «сигнал увімкнено / вимкнено» з тривалістю в мілісекундах. Мікрофон, аудіофайл, ручний ключ і текстове поле — це просто різні адаптери до неї. Завдяки цьому нове джерело додається без переписування логіки: достатньо навчитися віддавати `PlayStep[]`.',
    s02: '02 — ЯДРО',
    s02title: 'Числа на вході, числа на виході',
    s02p: 'Ядро свідомо не знає про браузер. Воно не має доступу ні до DOM, ні до звуку — тільки числа на вході й числа на виході. Це дозволяє перевіряти найтоншу частину — тайминг — юніт-тестами, а не на слух. Базова одиниця, крапка, рахується як `1200 / WPM` мілісекунд; решта тривалостей і пауз — кратні їй.',
    s03: '03 — ЗВУК',
    s03title: 'Ритм по годиннику, а не по таймерах',
    s03p: "Звук планується наперед по годиннику `AudioContext`, а не таймерами: таймери дають плаваючий ритм, який на слух чути одразу. Проти клацань на кожній крапці — коротка огинаюча гучності на п'ять мілісекунд.",
    s04: '04 — РУЧНИЙ КЛЮЧ',
    s04title: 'Пороги від обраної швидкості — і чому не інакше',
    s04p1: 'Швидкість задає людина, і від неї рахується все: тире від двох одиниць, нова літера від трьох, нове слово від семи. Числа видно в мілісекундах просто під ключем — саме для того, щоб було до чого підлаштовуватися.',
    s04p2: 'Вимірювати пороги зі стуку теж пробували, і від цього відмовилися. У живій руці паузи всередині літери й паузи між літерами зливаються в одну суцільну пляму — розділити те, що не розділене, не може жодна кластеризація. Гірше інше: такі пороги повзуть від знака до знака, а до порогу, який рухається, неможливо підлаштуватися. Обрана швидкість стоїть на місці, і тому їй можна навчитися.',
    s04p3: 'Час натискання читається з `timeStamp` події, а не з моменту, коли до неї дійшли руки. Різниця буває вирішальною: перше натискання на сторінці будує `AudioContext` і блокує потік на десятки мілісекунд — коротка крапка встигала вийти тире.',
    s05: '05 — ЗВІРКА',
    s05title: 'Спершу вирівняти, потім порівнювати',
    s05p: 'Один пропущений символ зсуває все, що йде за ним, тому позиційне порівняння звинувачує літери, які людина насправді почула. Замість нього — вирівнювання за відстанню Левенштейна з відновленням шляху, в обидва боки. Саме на ньому тримається статистика по літерах: без нього вона брехала б, а на ній стоїть добір завдань.',
    more: 'ЩЕ ПРО ПРОЄКТ',
  },
  en: {
    title: 'How it works',
    lead: 'Everything inside reduces to a single signal representation. The microphone, an audio file, the straight key and the text field are adapters to it, not separate subsystems.',
    s01: '01 — THE PIPELINE',
    s01title: 'One representation, different sources',
    s01p: 'Everything inside reduces to one type — a sequence of "signal on / signal off" steps with durations in milliseconds. The microphone, an audio file, the straight key and the text field are simply different adapters to it. A new source therefore needs no new logic: it only has to learn to produce `PlayStep[]`.',
    s02: '02 — THE CORE',
    s02title: 'Numbers in, numbers out',
    s02p: 'The core deliberately knows nothing about the browser. It has no access to the DOM or to audio — only numbers in and numbers out. That is what makes the most delicate part, the timing, testable as arithmetic rather than by ear. The base unit, the dot, is `1200 / WPM` milliseconds; every other duration and gap is a multiple of it.',
    s03: '03 — AUDIO',
    s03title: 'Rhythm on a clock, not on timers',
    s03p: 'Audio is scheduled ahead of time on the `AudioContext` clock, not with timers: timers produce a drifting rhythm, and drift is audible immediately. Against a click at the start of every dot there is a short five-millisecond gain envelope.',
    s04: '04 — THE STRAIGHT KEY',
    s04title: 'Thresholds from the speed you choose — and why not otherwise',
    s04p1: 'You set the speed, and everything follows from it: a dash from two units, a new letter from three, a new word from seven. The numbers are shown in milliseconds right under the key — precisely so there is something to aim at.',
    s04p2: 'Measuring the thresholds from your keying was tried too, and abandoned. In a real hand the gaps inside a character and the gaps between characters merge into one continuous spread — no clustering can separate what is not separated. Worse: thresholds like that drift from character to character, and a threshold that moves by itself cannot be learned. A speed you chose stays put, and so it can be learned.',
    s04p3: 'Key timing is read from the event\'s `timeStamp`, not from the moment the handler ran. The difference can be decisive: the first keypress on a page builds the `AudioContext` and blocks the thread for tens of milliseconds — a short dot used to come out as a dash.',
    s05: '05 — SCORING',
    s05title: 'Align first, then compare',
    s05p: 'A single missed character shifts everything after it, so positional comparison blames letters that were actually heard correctly. Instead there is Levenshtein alignment with backtracking, in both directions. The per-letter statistics rest on it: without alignment they would lie, and the drill selection is built on those statistics.',
    more: 'MORE ABOUT THE PROJECT',
  },
} as const

export function AboutHow() {
  const { lang } = useLang()
  const c = CONTENT[lang]

  return (
    <div className="page shell">
      <PageHead call={callsFor(lang).aboutHow} title={c.title} lead={c.lead} />

      <div className="about">
        <section className="about-sec">
          <span className="micro about-sec__label">{c.s01}</span>
          <h2 className="h2">{c.s01title}</h2>

          <div className="pipeline">
            <b>Text</b>
            <i>↔</i>
            <b>Symbols</b>
            <i>↔</i>
            <b>PlayStep[]</b>
            <i>↔</i>
            <b>Signal</b>
          </div>

          <div className="prose">
            <p>
              <Rich text={c.s01p} />
            </p>
          </div>
        </section>

        <section className="about-sec">
          <span className="micro about-sec__label">{c.s02}</span>
          <h2 className="h2">{c.s02title}</h2>
          <div className="prose">
            <p>
              <Rich text={c.s02p} />
            </p>
          </div>
        </section>

        <section className="about-sec">
          <span className="micro about-sec__label">{c.s03}</span>
          <h2 className="h2">{c.s03title}</h2>
          <div className="prose">
            <p>
              <Rich text={c.s03p} />
            </p>
          </div>
        </section>

        <section className="about-sec">
          <span className="micro about-sec__label">{c.s04}</span>
          <h2 className="h2">{c.s04title}</h2>
          <div className="prose">
            <p>
              <Rich text={c.s04p1} />
            </p>
            <p>
              <Rich text={c.s04p2} />
            </p>
            <p>
              <Rich text={c.s04p3} />
            </p>
          </div>
        </section>

        <section className="about-sec">
          <span className="micro about-sec__label">{c.s05}</span>
          <h2 className="h2">{c.s05title}</h2>
          <div className="prose">
            <p>
              <Rich text={c.s05p} />
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
