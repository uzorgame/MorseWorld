import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { encodeText, unsupportedCount } from '../../core/encode'
import { SELECTABLE_TABLE_IDS, TABLES, tableMeta } from '../../core/tables'
import { decodeMorse, readsAsMorse, readsAsText } from '../../core/decode'
import { gapsFor } from '../../core/timing'
import { readStrokes, type Stroke } from '../../core/keyDecoder'
import { morseToSteps } from '../../core/schedule'
import { audio } from '../../audio/MorseAudio'
import {
  onTranslatorIntent,
  takePendingIntent,
  type TranslatorIntent,
} from '../../lib/translatorIntent'
import { useLang } from '../../state/lang'
import { useTable } from '../../state/table'
import { KeyLegend } from '../practice/KeyLegend'
import { useStraightKey } from '../practice/useStraightKey'
import { TableSwitch } from '../shell/TableSwitch'
import { Slider } from './Slider'
import './translator.css'

type Direction = 'encode' | 'decode'

const PRETTY: Record<string, string> = { '.': '·', '-': '−' }

const STRINGS = {
  uk: {
    text: 'ТЕКСТ',
    chars: (n: number) => `${n} СИМВ.`,
    textPlaceholder: 'Введіть текст…',
    textAria: 'Текст',
    decodedPh: 'тут зʼявиться розшифровка',
    clear: 'Очистити',
    swap: 'Поміняти напрям',
    morse: 'МОРЗЕ',
    separator: 'РОЗДІЛЬНИК: /',
    mismatch: 'Схоже, це не та абетка',
    switchTo: (short: string, name: string) => `Перемкнути на ${short} — ${name}`,
    morsePlaceholder: '.... . .-.. .-.. ---',
    morseAria: 'Морзе',
    keyLeads: 'Поки ключ увімкнений, поле веде він',
    play: '▶ Програти',
    stop: '■ Стоп',
    copy: 'Копіювати',
    keyOn: '● Ключ увімкнено',
    manualInput: 'Ручний ввід',
    blocked: 'Браузер не дозволив звук без вашої дії — натисніть «Програти», і далі все звучатиме саме.',
    volume: 'ГУЧНІСТЬ',
    speed: 'ШВИДКІСТЬ',
    tone: 'ТОН',
    manualKey: 'РУЧНИЙ КЛЮЧ',
    manualKeyHint: 'ОДНА КЛАВІША НА ВСЕ — РІЗНИЦЯ ЛИШЕ В ТРИВАЛОСТІ',
    holdKey: 'Тримайте пробіл, Enter або цю площадку',
    textToMorse: 'ТЕКСТ → МОРЗЕ',
    morseToText: 'МОРЗЕ → ТЕКСТ',
  },
  en: {
    text: 'TEXT',
    chars: (n: number) => `${n} CHARS`,
    textPlaceholder: 'Type text…',
    textAria: 'Text',
    decodedPh: 'the decoded text will appear here',
    clear: 'Clear',
    swap: 'Swap direction',
    morse: 'MORSE',
    separator: 'SEPARATOR: /',
    mismatch: 'Looks like the wrong alphabet',
    switchTo: (short: string, name: string) => `Switch to ${short} — ${name}`,
    morsePlaceholder: '.... . .-.. .-.. ---',
    morseAria: 'Morse',
    keyLeads: 'While the key is on, it drives this field',
    play: '▶ Play',
    stop: '■ Stop',
    copy: 'Copy',
    keyOn: '● Key on',
    manualInput: 'Manual input',
    blocked: 'The browser blocked audio without your action — press "Play", and everything after will sound right away.',
    volume: 'VOLUME',
    speed: 'SPEED',
    tone: 'TONE',
    manualKey: 'STRAIGHT KEY',
    manualKeyHint: 'ONE KEY FOR EVERYTHING — ONLY THE HOLD LENGTH DIFFERS',
    holdKey: 'Hold Space, Enter, or this pad',
    textToMorse: 'TEXT → MORSE',
    morseToText: 'MORSE → TEXT',
  },
} as const

export function Translator() {
  const { table, tableId, setTableId } = useTable()
  const { lang } = useLang()
  const t = STRINGS[lang]

  const [dir, setDir] = useState<Direction>('encode')
  const [text, setText] = useState('SOS Hello world')
  const [morseInput, setMorseInput] = useState('... --- ...')

  const [wpm, setWpm] = useState(20)
  const [freq, setFreq] = useState(600)
  const [volume, setVolume] = useState(0.25)

  const [played, setPlayed] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [manual, setManual] = useState(false)

  const gaps = useMemo(() => gapsFor(wpm), [wpm])

  // У режимі кодування джерело — текст, у режимі декодування — морзе.
  const morse = dir === 'encode' ? encodeText(text, table) : morseInput
  const plain = dir === 'encode' ? text : decodeMorse(morseInput, table)

  const steps = useMemo(() => morseToSteps(morse, gaps), [morse, gaps])

  const stop = useCallback(() => {
    audio.stop()
    setPlaying(false)
  }, [])

  const playAll = useCallback(async () => {
    if (playing) {
      stop()
      return
    }
    const ok = audio.running || (await audio.unlock())
    setBlocked(!ok)
    if (!ok) return

    setPlayed(-1)
    setPlaying(true)
    audio.play(steps, {
      freq,
      volume,
      onProgress: setPlayed,
      onEnd: () => setPlaying(false),
    })
  }, [playing, stop, steps, freq, volume])

  /** Скільки символів на початку двох рядків збігається. */
  const commonPrefix = (a: string, b: string) => {
    let i = 0
    while (i < a.length && i < b.length && a[i] === b[i]) i++
    return i
  }

  /**
   * Текст не тією абеткою.
   *
   * Підказка існує лише щоб запропонувати перемикання, тому й показується
   * тільки тоді, коли є куди перемикатися. Якщо жодна з пропонованих таблиць
   * не кодує цей текст краще — річ не в таблиці, і поле лишається як є.
   */
  const switchTo = useMemo(() => {
    if (dir !== 'encode' || !text.trim()) return null

    const missing = unsupportedCount(text, table)
    if (missing === 0) return null

    const better = SELECTABLE_TABLE_IDS.filter((id) => id !== tableId)
      .map((id) => ({ id, missing: unsupportedCount(text, TABLES[id]) }))
      .filter((candidate) => candidate.missing < missing)
      .sort((a, b) => a.missing - b.missing)[0]

    return better?.id ?? null
  }, [dir, text, table, tableId])

  const prevMorse = useRef(morse)

  /**
   * Напрям визначається сам.
   *
   * Морзянка, що потрапила в поле тексту, — це запит на розшифровку, а не текст:
   * кодувати крапки в крапки безглуздо. І навпаки, літера в полі коду означає,
   * що людина передумала й пише словами. Перемикач `⇄` лишається — він потрібен,
   * коли ввід порожній або однаково читається в обидва боки.
   *
   * Фокус переносимо на поле, яке стало активним: панелі при зміні напряму
   * міняються місцями, і без цього каретка лишалася б у полі, якого вже немає.
   */
  const textField = useRef<HTMLTextAreaElement>(null)
  const morseField = useRef<HTMLTextAreaElement>(null)
  const refocus = useRef<'text' | 'morse' | null>(null)

  useEffect(() => {
    if (refocus.current === 'text') textField.current?.focus()
    if (refocus.current === 'morse') morseField.current?.focus()
    refocus.current = null
  }, [dir])

  const onTextChange = (next: string) => {
    if (readsAsMorse(next)) {
      audio.stop()
      setPlaying(false)
      setPlayed(-1)
      setMorseInput(next)
      refocus.current = 'morse'
      setDir('decode')
      return
    }

    setText(next)

    // Текст змінився — те, що звучало, стосувалося вже неіснуючого коду.
    // Обриваємо одразу, інакше видалений текст доспівує сам собі.
    audio.stop()
    setPlaying(false)

    const nextMorse = encodeText(next, table)
    const from = commonPrefix(prevMorse.current, nextMorse)
    prevMorse.current = nextMorse

    // Усе, що збіглося з попереднім станом, уже прозвучало — лишається помаранчевим.
    setPlayed(from - 1)

    const fresh = morseToSteps(nextMorse, gaps).filter((s) => s.index >= from)
    if (fresh.length === 0 || volume === 0) return

    // Коли звук уже відкритий — граємо без жодного очікування: між натисканням
    // клавіші і тоном має бути мінімум затримки.
    if (audio.running) {
      setBlocked(false)
      audio.play(fresh, { freq, volume, onProgress: setPlayed })
      return
    }

    void audio.unlock().then((ok) => {
      setBlocked(!ok)
      if (ok) audio.play(fresh, { freq, volume, onProgress: setPlayed })
    })
  }

  const onMorseChange = (next: string) => {
    if (readsAsText(next)) {
      audio.stop()
      setPlaying(false)
      setPlayed(-1)
      setText(next)
      prevMorse.current = encodeText(next, table)
      setManual(false)
      refocus.current = 'text'
      setDir('encode')
      return
    }
    setMorseInput(next)
  }

  // Зміна таблиці переписує весь код — почнімо слухати його спочатку.
  useEffect(() => {
    prevMorse.current = morse
    setPlayed(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  useEffect(() => () => audio.stop(), [])

  /** ---------- намір із меню ---------- */

  const [intent, setIntent] = useState<TranslatorIntent | null>(null)
  const [pendingPlay, setPendingPlay] = useState(false)

  // Забираємо намір саме в ефекті: ініціалізатор стану має бути чистим,
  // а takePendingIntent змінює стан модуля — у строгому режимі його викликало б
  // двічі, і другий виклик з'їдав би намір нанівець.
  useEffect(() => {
    const off = onTranslatorIntent(setIntent)
    const pending = takePendingIntent()
    if (pending) setIntent(pending)
    return off
  }, [])

  useEffect(() => {
    if (!intent) return
    setIntent(null)
    audio.stop()
    setPlaying(false)
    setPlayed(-1)

    if (intent === 'decode') {
      if (dir === 'encode') {
        setMorseInput(morse)
        setDir('decode')
      }
      return
    }

    if (dir === 'decode') {
      setText(plain)
      prevMorse.current = morse
      setDir('encode')
      setManual(false)
    }
    if (intent === 'play') setPendingPlay(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent])

  // Програвання чекає, поки напрям справді перемкнеться, — інакше візьме старий код.
  useEffect(() => {
    if (!pendingPlay || dir !== 'encode') return
    setPendingPlay(false)
    void playAll()
  }, [pendingPlay, dir, playAll])

  // Зміна напряму переносить те, що вже набрано, а не скидає роботу.
  const swap = () => {
    stop()
    setPlayed(-1)
    if (dir === 'encode') {
      setMorseInput(morse)
      setDir('decode')
    } else {
      setText(plain)
      prevMorse.current = morse
      setDir('encode')
      setManual(false)
    }
  }

  /** ---------- ручний ключ ---------- */

  // Те, що вже було в полі, коли ввімкнули ключ, — стук дописується до нього.
  const keyBase = useRef('')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  // Ключ читається за тією ж швидкістю, що стоїть на повзунку: пороги мусять
  // означати те саме, що й програвання, інакше відстукане не збігається з почутим.
  const keyReading = useMemo(() => readStrokes(strokes, wpm), [strokes, wpm])

  useEffect(() => {
    if (!manual) return
    const tail = keyReading.morse
    const base = keyBase.current
    setMorseInput(base && tail ? `${base} ${tail}` : base + tail)
  }, [keyReading.morse, manual])

  const toggleManual = () => {
    setManual((on) => {
      if (!on) {
        keyBase.current = morseInput.trim()
        setStrokes([])
      }
      return !on
    })
  }

  /** Поки ключ увімкнений, поле веде він — тому чистити треба і його пам'ять. */
  const clearMorse = () => {
    keyBase.current = ''
    setStrokes([])
    setMorseInput('')
  }

  const {
    pressed: keyDown,
    press: keyPress,
    release: keyRelease,
  } = useStraightKey({
    freq,
    volume,
    enabled: manual,
    onStroke: (stroke) => setStrokes((list) => [...list, stroke]),
  })

  /** ---------- розмітка ---------- */

  const morseGlyphs = [...morse].map((ch, i) => (
    <span key={i} data-played={i <= played ? '' : undefined}>
      {PRETTY[ch] ?? ch}
    </span>
  ))

  return (
    <div className="tr-wrap">
      {/* Джерело завжди ліворуч: інакше «поміняти напрям» переносило вміст,
          але панелі лишалися на місцях, і зміну майже не було видно. */}
      <div className="card tr" data-dir={dir}>
        {/* ---------- текст ---------- */}
        <div className="tr__side tr__side--text">
          <div className="tr__head">
            <span className="micro">{t.text}</span>
            <span className="micro">{t.chars(plain.length)}</span>
          </div>

          {dir === 'encode' ? (
            <textarea
              ref={textField}
              className="tr__field"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={t.textPlaceholder}
              aria-label={t.textAria}
              spellCheck={false}
            />
          ) : (
            <output className="tr__field tr__out" aria-live="polite">
              {plain || <span className="tr__ph">{t.decodedPh}</span>}
            </output>
          )}

          <div className="tr__foot">
            <span className="micro">{tableMeta(tableId, lang).name}</span>
            {dir === 'encode' && (
              <button className="btn btn--quiet" onClick={() => onTextChange('')}>
                {t.clear}
              </button>
            )}
          </div>
        </div>

        <div className="tr__divider">
          <button className="tr__swap" aria-label={t.swap} type="button" onClick={swap}>
            ⇄
          </button>
        </div>

        {/* ---------- морзе ---------- */}
        <div className="tr__side tr__side--morse">
          <div className="tr__head">
            <span className="micro micro--accent">{t.morse}</span>
            <span className="micro">{dir === 'encode' ? `${wpm} WPM · ${freq} Hz` : t.separator}</span>
          </div>

          {dir === 'encode' && switchTo ? (
            <output className="tr__field tr__swapnote">
              <b>{t.mismatch}</b>
              <button type="button" className="btn btn--accent" onClick={() => setTableId(switchTo)}>
                {t.switchTo(tableMeta(switchTo, lang).short, tableMeta(switchTo, lang).name)}
              </button>
            </output>
          ) : dir === 'encode' ? (
            <output className="tr__field tr__morse" data-playing={playing ? '' : undefined}>
              {morse ? morseGlyphs : <span className="tr__ph">· − · ·</span>}
            </output>
          ) : (
            <textarea
              ref={morseField}
              className="tr__field tr__field--morse"
              value={morseInput}
              onChange={(e) => onMorseChange(e.target.value)}
              placeholder={t.morsePlaceholder}
              aria-label={t.morseAria}
              spellCheck={false}
              readOnly={manual}
              title={manual ? t.keyLeads : undefined}
            />
          )}

          <div className="tr__foot">
            {dir === 'encode' ? (
              <>
                <button className="btn btn--quiet tr__play" onClick={playAll}>
                  {playing ? t.stop : t.play}
                </button>
                <button
                  className="btn btn--quiet"
                  onClick={() => void navigator.clipboard?.writeText(morse)}
                >
                  {t.copy}
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn--quiet"
                  data-active={manual ? '' : undefined}
                  onClick={toggleManual}
                >
                  {manual ? t.keyOn : t.manualInput}
                </button>
                <button className="btn btn--quiet" onClick={clearMorse}>
                  {t.clear}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {blocked && <p className="tr__blocked micro">{t.blocked}</p>}

      {/* ---------- керування звуком ----------
          Стоїть в обох напрямах, а не лише в «текст → морзе». У зворотному
          напрямі ці самі три значення тримають ручний ключ: гучність і тон —
          його звук, а WPM — пороги, за якими натискання читається крапкою чи
          тире. Ховати панель означало б забирати керування ключем разом із нею. */}
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
        <Slider label={t.speed} value={wpm} min={5} max={40} step={1} unit=" WPM" onChange={setWpm} />
        <Slider
          label={t.tone}
          value={freq}
          min={400}
          max={1000}
          step={10}
          unit=" Hz"
          onChange={setFreq}
        />
      </div>

      {/* ---------- ручний ключ ---------- */}
      {dir === 'decode' && manual && (
        <div className="tr-key">
          <div className="tr-key__meta">
            <span className="micro micro--accent">{t.manualKey}</span>
            <span className="micro">{t.manualKeyHint}</span>
          </div>

          <KeyLegend thresholds={keyReading.thresholds} />
          <button
            type="button"
            className="tr-key__pad"
            data-key-pad=""
            data-down={keyDown ? '' : undefined}
            onPointerDown={(e) => {
              e.preventDefault()
              keyPress(e.timeStamp)
            }}
            onPointerUp={(e) => keyRelease(e.timeStamp)}
            onPointerLeave={(e) => keyRelease(e.timeStamp)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span className="tr-key__hint">{t.holdKey}</span>
          </button>
        </div>
      )}

      <div className="tr-meta">
        <TableSwitch />
        <span className="micro">{dir === 'encode' ? t.textToMorse : t.morseToText}</span>
      </div>
    </div>
  )
}
