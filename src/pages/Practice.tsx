import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

import { decodeMorse } from '../core/decode'
import {
  WPM_MAX,
  WPM_MIN,
  groupStrokes,
  idleFor,
  measureKeying,
  morseOf,
  suggestWpm,
  thresholdsFor,
  unitFor,
  type Stroke,
} from '../core/keyDecoder'
import { tableMeta } from '../core/tables'
import { callsFor } from '../components/shell/CallSign'
import { TableSwitch } from '../components/shell/TableSwitch'
import { Slider } from '../components/translator/Slider'
import { KeyLegend } from '../components/practice/KeyLegend'
import { useStraightKey } from '../components/practice/useStraightKey'
import { useLang } from '../state/lang'
import { useTable } from '../state/table'
import { PageHead } from './PageHead'
import './pages.css'
import './practice.css'

const PRETTY = (code: string) => code.replace(/\./g, '·').replace(/-/g, '−')

/** Наскільки близько до порогу вважати «на межі»: ±20% у кратному вимірі. */
const EDGE = Math.log(1.2)
const nearEdge = (value: number, bound: number) =>
  value > 0 && bound > 0 && Math.abs(Math.log(value / bound)) < EDGE

const STRINGS = {
  uk: {
    title: 'Пісочниця — ручний ключ',
    lead: 'Тримайте пробіл, Enter або площадку нижче. Швидкість задаєте ви — від неї рахуються всі пороги, і вони не рухаються під час передачі. Точні межі в мілісекундах видно нижче, тому до них можна підлаштуватися.',
    sending: 'ПЕРЕДАЮ',
    receiving: 'НА ПРИЙОМІ',
    ready: 'ГОТОВО ДО ПЕРЕДАЧІ',
    speedUnit: 'WPM · ШВИДКІСТЬ',
    unit: 'МС · ОДИНИЦЯ',
    taken: 'ЗНАКІВ ПРИЙНЯТО',
    padAria: 'Телеграфний ключ',
    holdToSend: 'ТРИМАЙТЕ, ЩОБ ПЕРЕДАВАТИ',
    padUnit: 'пробіл · Enter · миша · дотик — Backspace стирає останнє',
    ribbonEmpty: 'СТРІЧКА ПОРОЖНЯ',
    letterInWork: 'ЛІТЕРА В РОБОТІ',
    accepted: 'ПРИЙНЯТО',
    acceptedPh: 'тут зʼявиться те, що ви відстукали',
    transcript: 'ТРАНСКРИПЦІЯ',
    clear: 'Очистити',
    volume: 'ГУЧНІСТЬ',
    speed: 'ШВИДКІСТЬ',
    tone: 'ТОН',
    aimTitle: 'ВАШ СТУК ПРОТИ ЦІЛІ',
    aimAdvice: (wpm: number) => `Ця швидкість вас не читає — поставити ${wpm} WPM`,
    aimEmpty: 'ПОКИ НЕМА З ЧОГО МІРЯТИ — ПЕРЕДАЙТЕ КІЛЬКА ЗНАКІВ',
    target: 'ціль',
    aimNote: 'У ціль бити точно не обовʼязково — важливо не переступити поріг. Червоним позначено те, що нинішня швидкість читає неправильно; найчастіше це пауза всередині літери, бо рука тримає знак коротко, а між знаками зупиняється надовго.',
    aheadTitle: 'ЩЕ ПОПЕРЕДУ',
    ahead: [
      'Режим iambic: дві клавіші, автоматичні крапки й тире',
      'Тренування за зразком: передати задане слово й побачити розбіжності',
      'Farnsworth: знаки на одній швидкості, паузи на іншій',
    ],
    ms: (v: number) => (v > 0 ? `${Math.round(v)} мс` : '—'),
    rows: { dot: 'крапка', dash: 'тире', intra: 'пауза в літері', letter: 'пауза між літерами' },
  },
  en: {
    title: 'Sandbox — straight key',
    lead: 'Hold Space, Enter, or the pad below. You set the speed — every threshold is derived from it and none of them shift while you send. The exact limits are shown in milliseconds below, so you can aim for them.',
    sending: 'SENDING',
    receiving: 'RECEIVING',
    ready: 'READY TO SEND',
    speedUnit: 'WPM · SPEED',
    unit: 'MS · UNIT',
    taken: 'CHARACTERS TAKEN',
    padAria: 'Telegraph key',
    holdToSend: 'HOLD TO SEND',
    padUnit: 'space · Enter · mouse · touch — Backspace erases the last one',
    ribbonEmpty: 'RIBBON IS EMPTY',
    letterInWork: 'LETTER IN PROGRESS',
    accepted: 'RECEIVED',
    acceptedPh: 'what you key will appear here',
    transcript: 'TRANSCRIPT',
    clear: 'Clear',
    volume: 'VOLUME',
    speed: 'SPEED',
    tone: 'TONE',
    aimTitle: 'YOUR KEYING VS. THE TARGET',
    aimAdvice: (wpm: number) => `This speed isn't reading you — set it to ${wpm} WPM`,
    aimEmpty: 'NOTHING TO MEASURE YET — SEND A FEW CHARACTERS',
    target: 'target',
    aimNote: 'Hitting the target exactly is not required — what matters is not crossing the threshold. Red marks what the current speed reads wrong; most often it is the gap inside a letter, because the hand holds the sign short but pauses too long between signs.',
    aheadTitle: 'STILL AHEAD',
    ahead: [
      'Iambic mode: two paddles, automatic dots and dashes',
      'Drill by example: send a given word and see the differences',
      'Farnsworth: characters at one speed, gaps at another',
    ],
    ms: (v: number) => (v > 0 ? `${Math.round(v)} ms` : '—'),
    rows: { dot: 'dot', dash: 'dash', intra: 'gap inside letter', letter: 'gap between letters' },
  },
} as const

export function Practice() {
  const { table, tableId } = useTable()
  const { lang } = useLang()
  const t = STRINGS[lang]

  const [wpm, setWpm] = useState(17)
  const [freq, setFreq] = useState(600)
  const [volume, setVolume] = useState(0.25)

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [settled, setSettled] = useState(true)

  const thresholds = useMemo(() => thresholdsFor(wpm), [wpm])
  const unit = unitFor(wpm)

  const { pressed, press, release, reset } = useStraightKey({
    freq,
    volume,
    enabled: true,
    onStroke: (stroke) => {
      setSettled(false)
      setStrokes((list) => [...list, stroke])
    },
  })

  // Поки клавіша натиснута, літера точно не закінчена — навіть якщо таймер
  // тиші встиг спрацювати від попереднього знака.
  const open = pressed || !settled

  // Останню літеру не показуємо готовою, доки триває передача: невідомо, чи
  // це її кінець, чи буде продовження. Поріг тиші — той самий поріг літери.
  useEffect(() => {
    if (strokes.length === 0 || pressed) return
    const id = window.setTimeout(() => setSettled(true), idleFor(thresholds))
    return () => window.clearTimeout(id)
  }, [strokes, pressed, thresholds])

  const letters = useMemo(() => groupStrokes(strokes, thresholds), [strokes, thresholds])
  const morse = useMemo(() => morseOf(letters), [letters])

  const { done, pendingCode } = useMemo(() => {
    const tokens = morse.trim().split(/\s+/).filter(Boolean)
    if (!open || tokens.length === 0) return { done: tokens.join(' '), pendingCode: '' }
    const last = tokens[tokens.length - 1]!
    if (last === '/') return { done: tokens.join(' '), pendingCode: '' }
    return { done: tokens.slice(0, -1).join(' '), pendingCode: last }
  }, [morse, open])

  const text = useMemo(() => decodeMorse(done, table), [done, table])

  // Виміри й порада не залежать від повзунка — інакше з невдало виставленої
  // швидкості не було б як вибратися.
  const keying = useMemo(() => measureKeying(strokes), [strokes])
  const advice = useMemo(() => suggestWpm(strokes), [strokes])

  const undo = () => {
    reset()
    setStrokes((list) => list.slice(0, -1))
    setSettled(true)
  }

  const clear = () => {
    reset()
    setStrokes([])
    setSettled(true)
  }

  const undoRef = useRef(undo)
  undoRef.current = undo

  // Стирання лишається на Backspace — так само, як у будь-якому полі вводу.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace') return
      e.preventDefault()
      undoRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** ---------- подання ---------- */

  const ms = t.ms
  const taken = letters.filter((l) => l.code.length > 0).length

  const stage = pressed ? 'sending' : strokes.length > 0 ? 'live' : 'idle'
  const label = pressed ? t.sending : strokes.length > 0 ? t.receiving : t.ready

  /**
   * Ваше проти цілі.
   *
   * `bad` — не «далеко від цілі», а «поточна швидкість прочитає це неправильно».
   * Різниця істотна: стукати не в ціль можна досить вільно й усе одно бути
   * розібраним, і чіпляти око там нема за що. Позначаємо тільки справжні збої —
   * крапку, довшу за поріг тире; паузу всередині літери, довшу за поріг літери;
   * і навпаки.
   */
  const AIM = [
    {
      name: t.rows.dot,
      actual: keying.dot,
      target: unit,
      bad: keying.dot > 0 && keying.dot >= thresholds.dashAt,
    },
    {
      name: t.rows.dash,
      actual: keying.dash,
      target: unit * 3,
      bad: keying.dash > 0 && keying.dash < thresholds.dashAt,
    },
    {
      name: t.rows.intra,
      actual: keying.intraGap,
      target: unit,
      bad: keying.intraGap > 0 && keying.intraGap >= thresholds.letterAt,
    },
    {
      name: t.rows.letter,
      actual: keying.letterGap,
      target: unit * 3,
      // Дві помилки з різних боків, і перевіряти треба обидві: закоротка пауза
      // склеює літери, а задовга розриває слово там, де його немає. Друге
      // раніше проходило мовчки — літери виходили правильні, але текст
      // розсипався на слова, і панель не мала що сказати.
      bad:
        keying.letterGap > 0 &&
        (keying.letterGap < thresholds.letterAt || keying.letterGap >= thresholds.wordAt),
    },
  ]

  /** Порада має сенс тільки коли нинішня швидкість реально ламає розбір. */
  const mismatch = AIM.some((row) => row.bad)

  return (
    <div className="page shell">
      <PageHead call={callsFor(lang).practice} title={t.title} lead={t.lead} aside={<TableSwitch />} />

      <div className="key">
        {/* ---------- смуга стану ---------- */}
        <div className="key__bar" data-stage={stage}>
          <span className="key__bar-cell key__bar-state">
            <i className="key__mark" aria-hidden="true" />
            <span className="micro">{label}</span>
          </span>
          <span className="key__bar-cell">
            <b className="mono">{wpm}</b>
            <span className="micro">{t.speedUnit}</span>
          </span>
          <span className="key__bar-cell">
            <b className="mono">{Math.round(unit)}</b>
            <span className="micro">{t.unit}</span>
          </span>
          <span className="key__bar-cell">
            <b className="mono">{taken}</b>
            <span className="micro">{t.taken}</span>
          </span>
        </div>

        {/* ---------- площадка ---------- */}
        <button
          type="button"
          className="key__pad"
          data-key-pad=""
          data-down={pressed ? '' : undefined}
          onPointerDown={(e) => {
            e.preventDefault()
            press(e.timeStamp)
          }}
          onPointerUp={(e) => release(e.timeStamp)}
          onPointerLeave={(e) => release(e.timeStamp)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={t.padAria}
        >
          <span className="key__pad-inner">
            <span className="micro">{pressed ? t.sending : t.holdToSend}</span>
            <b className="key__unit mono">{t.padUnit}</b>
          </span>
        </button>

        {/* ---------- жива стрічка ---------- */}
        <div className="key__ribbon" aria-hidden="true">
          {strokes.length === 0 && !pressed ? (
            <span className="key__ribbon-empty micro">{t.ribbonEmpty}</span>
          ) : (
            strokes.map((stroke, i) => {
              const word = i > 0 && stroke.gap >= thresholds.wordAt
              const letter = i > 0 && !word && stroke.gap >= thresholds.letterAt
              return (
                <Fragment key={i}>
                  {word && (
                    <b className="key__sep" data-word="">
                      /
                    </b>
                  )}
                  {letter && <b className="key__sep" />}
                  <i
                    data-el={stroke.hold >= thresholds.dashAt ? 'dash' : 'dot'}
                    data-edge={nearEdge(stroke.hold, thresholds.dashAt) ? '' : undefined}
                  />
                </Fragment>
              )
            })
          )}
          {pressed && <i data-el="live" />}
        </div>

        <KeyLegend thresholds={thresholds} />

        {/* ---------- що виходить ---------- */}
        <div className="key__read">
          <div className="key__now">
            <span className="micro">{t.letterInWork}</span>
            <b className="mono">{pendingCode ? PRETTY(pendingCode) : '—'}</b>
          </div>

          <div className="key__text">
            <span className="micro">{t.accepted}</span>
            <p aria-live="polite">
              {text || <span className="key__ph">{t.acceptedPh}</span>}
              {pendingCode && <span className="key__cursor" aria-hidden="true" />}
            </p>
          </div>
        </div>

        {/* ---------- транскрипція ---------- */}
        <div className="key__morse">
          <span className="micro">{t.transcript}</span>
          <code className="mono">{morse ? PRETTY(morse) : <span className="key__ph">—</span>}</code>
        </div>

        <div className="key__foot">
          <span className="micro">{tableMeta(tableId, lang).name}</span>
          <button className="btn btn--quiet" onClick={clear} disabled={strokes.length === 0}>
            {t.clear}
          </button>
        </div>
      </div>

      <div className="tr-controls">
        <Slider
          label={t.volume}
          value={Math.round(volume * 100)}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => setVolume(v / 100)}
        />
        <Slider label={t.speed} value={wpm} min={WPM_MIN} max={WPM_MAX} step={1} unit=" WPM" onChange={setWpm} />
        <Slider label={t.tone} value={freq} min={400} max={1000} step={10} unit=" Hz" onChange={setFreq} />
      </div>

      {/* ---------- ваш стук проти цілі ----------
          Стоїть під повзунками навмисно: це відповідь на питання «яку швидкість
          поставити», тому й лежить поруч із тим повзунком, який її задає. */}
      <div className="key__aim">
        <div className="key__aim-head">
          <span className="micro micro--accent">{t.aimTitle}</span>
          {mismatch && advice !== null && advice !== wpm && (
            <button type="button" className="btn btn--accent" onClick={() => setWpm(advice)}>
              {t.aimAdvice(advice)}
            </button>
          )}
        </div>

        {strokes.length < 2 ? (
          <span className="micro">{t.aimEmpty}</span>
        ) : (
          <dl className="key__aim-grid">
            {AIM.map((row) => (
              <div className="key__aim-row" key={row.name} data-off={row.bad ? '' : undefined}>
                <dt>{row.name}</dt>
                <dd className="mono">
                  {ms(row.actual)} <span>{t.target} {ms(row.target)}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}

        <p className="key__aim-note">{t.aimNote}</p>
      </div>

      <div className="stub" style={{ marginTop: 'var(--s-6)' }}>
        <span className="micro">{t.aheadTitle}</span>
        <div className="stub__body">
          <ul>
            {t.ahead.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
