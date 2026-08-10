import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { audio } from '../audio/MorseAudio'
import { scoreOf, type Score, type SendScore } from '../core/drill'
import { encodeText } from '../core/encode'
import { morseToSteps } from '../core/schedule'
import { passagesOf, prepareFor } from '../core/text'
import { gapsFor } from '../core/timing'
import { TEXTS } from '../content/texts'
import { international } from '../core/tables/international'
import { callsFor } from '../components/shell/CallSign'
import { SendPad } from '../components/learn/SendPad'
import { Slider } from '../components/translator/Slider'
import { counted, countedEn } from '../lib/plural'
import { useLang } from '../state/lang'
import { useProgress } from '../state/progress'
import { PageHead } from './PageHead'
import './pages.css'
import './learn.css'

/** Скільки слів в одному уривку: більше — і слухач забуде початок. */
const WORDS_PER_PASSAGE = 6

/** Пунктуація й регістр до звірки не належать — важливі літери. */
const compare = (value: string) => value.toUpperCase().replace(/[^\p{L}\p{N}]/gu, '')

/** Той самий текст із двох боків: почути й записати — або прочитати й відстукати. */
type Mode = 'copy' | 'send'

const MODES: Record<'uk' | 'en', { id: Mode; label: string; hint: string }[]> = {
  uk: [
    { id: 'copy', label: 'ПРИЙМАННЯ', hint: 'Звучить текст — записуєте літерами' },
    { id: 'send', label: 'ПЕРЕДАВАННЯ', hint: 'Текст перед очима — відстукуєте ключем' },
  ],
  en: [
    { id: 'copy', label: 'COPYING', hint: 'The text sounds — you write the letters' },
    { id: 'send', label: 'SENDING', hint: 'The text is in front of you — you key it' },
  ],
}

const STRINGS = {
  uk: {
    title: 'Читання текстів',
    lead: 'Справжні книжки замість випадкових літер. Тільки суспільне надбання: автор помер понад сімдесят років тому. Тексти лежать у репозиторії статичним модулем — під час роботи сторінка не робить жодного мережевого запиту.',
    backToKoch: '← Метод Коха',
    allTexts: '← Усі тексти',
    passages: (n: number) => counted(n, 'УРИВОК', 'УРИВКИ', 'УРИВКІВ'),
    progress: (seen: number, total: number) => `ПРОЙДЕНО ${seen} З ${total}`,
    corpusNote:
      'Кожен текст — уривок із зазначенням джерела й ліцензії. Формулювання й посилання ще звіряються з першоджерелом, тому збірка поки коротка: краще три перевірені уривки, ніж тридцять переказаних.',
    modeAria: 'Режим',
    keyItByHand: 'ПЕРЕДАЙТЕ ТЕКСТ КЛЮЧЕМ',
    sounding: '● ЗВУЧИТЬ — СЛУХАЙТЕ',
    writeWhatYouHeard: 'ЗАПИШІТЬ, ЩО ПОЧУЛИ',
    result: 'РЕЗУЛЬТАТ',
    readyToSend: 'ГОТОВО ДО ПЕРЕДАЧІ',
    passageOf: (at: number, total: number) => `УРИВОК ${at} З ${total}`,
    audioBlocked: 'Браузер не дозволив звук. Натисніть будь-де на сторінці й спробуйте ще раз.',
    dropped: (n: number) =>
      `${n} символів тексту ця таблиця не кодує — вони прибрані до передачі, щоб у звуці не з’явилося німих проміжків.`,
    pressSendFirst: 'Спершу натисніть «Передати»',
    typeHere: 'Пишіть тут…',
    heardAria: 'Що ви почули',
    send: 'Передати',
    check: 'Перевірити',
    repeat: 'Повторити',
    nextPassage: 'Наступний уривок',
    startOver: 'Почати заново',
    textDone: 'Текст пройдено — почати заново',
    showText: 'Показати текст',
    prev: '← Попередній',
    next: 'Наступний →',
    volume: 'ГУЧНІСТЬ',
    charSpeed: 'ШВИДКІСТЬ ЗНАКІВ',
    effective: 'ЕФЕКТИВНА',
    tone: 'ТОН',
    licence: 'Суспільне надбання',
  },
  en: {
    title: 'Reading texts',
    lead: 'Real books instead of random letters. Public domain only: the author died more than seventy years ago. The texts live in the repository as a static module — while you work, the page makes no network request at all.',
    backToKoch: '← Koch method',
    allTexts: '← All texts',
    passages: (n: number) => countedEn(n, 'PASSAGE', 'PASSAGES'),
    progress: (seen: number, total: number) => `${seen} OF ${total} DONE`,
    corpusNote:
      'Each text is an excerpt with its source and licence stated. The wording and the links are still being checked against the primary source, so the collection is short for now: three verified excerpts are worth more than thirty paraphrased ones.',
    modeAria: 'Mode',
    keyItByHand: 'KEY THE TEXT',
    sounding: '● SOUNDING — LISTEN',
    writeWhatYouHeard: 'WRITE DOWN WHAT YOU HEARD',
    result: 'RESULT',
    readyToSend: 'READY TO SEND',
    passageOf: (at: number, total: number) => `PASSAGE ${at} OF ${total}`,
    audioBlocked: 'The browser blocked audio. Click anywhere on the page and try again.',
    dropped: (n: number) =>
      `${n} characters of this text have no code in this table — they were removed before sending, so no silent gaps appear in the audio.`,
    pressSendFirst: 'Press "Send" first',
    typeHere: 'Type here…',
    heardAria: 'What you heard',
    send: 'Send',
    check: 'Check',
    repeat: 'Repeat',
    nextPassage: 'Next passage',
    startOver: 'Start over',
    textDone: 'Text complete — start over',
    showText: 'Show the text',
    prev: '← Previous',
    next: 'Next →',
    volume: 'VOLUME',
    charSpeed: 'CHARACTER SPEED',
    effective: 'EFFECTIVE',
    tone: 'TONE',
    licence: 'Public domain',
  },
} as const

type Phase = 'ready' | 'playing' | 'typing' | 'checked'

/**
 * Читання йде тільки міжнародною таблицею — і читає її напряму, а не з
 * глобального вибору, з тієї самої причини, що й уроки: перемикача на сторінці
 * немає, тому вибір, зроблений на іншій сторінці, було б нічим виправити.
 */
const table = international

export function Reading() {
  const { progress, setReadingAt, recordSent } = useProgress()
  const { lang } = useLang()
  const t = STRINGS[lang]

  const [openId, setOpenId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('copy')

  const [wpm, setWpm] = useState(20)
  const [effective, setEffective] = useState(10)
  const [freq, setFreq] = useState(600)
  const [volume, setVolume] = useState(0.25)

  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<Phase>('ready')
  const [score, setScore] = useState<Score | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [reveal, setReveal] = useState(false)

  const input = useRef<HTMLInputElement>(null)
  const spacing = Math.min(effective, wpm)

  const text = TEXTS.find((t) => t.id === openId) ?? null

  /** Текст готуємо під активну таблицю: чого вона не кодує, у звук не потрапить. */
  const prepared = useMemo(
    () => (text ? prepareFor(text.body, table) : { text: '', dropped: 0 }),
    [text, table],
  )
  const passages = useMemo(() => passagesOf(prepared.text, WORDS_PER_PASSAGE), [prepared.text])

  const at = Math.min(text ? (progress.reading[text.id] ?? 0) : 0, Math.max(0, passages.length - 1))
  const passage = passages[at] ?? ''
  const done = text ? at >= passages.length - 1 && phase === 'checked' : false

  const speak = useCallback(
    async (value: string) => {
      if (!value) return
      const ok = audio.running || (await audio.unlock())
      setBlocked(!ok)
      if (!ok) return

      const steps = morseToSteps(encodeText(value, table, ' ', ' / '), gapsFor(wpm, spacing))
      setPhase('playing')
      audio.play(steps, {
        freq,
        volume,
        onEnd: () => {
          setPhase('typing')
          input.current?.focus()
        },
      })
    },
    [table, wpm, spacing, freq, volume],
  )

  // Стабільний обробник: SendPad визнає правильну передачу сам, в ефекті, і
  // новий колбек на кожен рендер змушував би той ефект перезапускатися марно.
  const onSent = useCallback((result: SendScore) => recordSent(result.cells), [recordSent])

  const check = useCallback(() => {
    // Разом зі звуком гаситься і його onEnd — інакше він перекинув би фазу
    // назад у ввід уже після того, як результат показано.
    audio.stop()
    setScore(scoreOf(compare(passage), compare(typed)))
    setPhase('checked')
  }, [passage, typed])

  const goTo = useCallback(
    (index: number) => {
      if (!text) return
      audio.stop()
      setReadingAt(text.id, Math.min(Math.max(0, index), passages.length - 1))
      setTyped('')
      setScore(null)
      setReveal(false)
      setPhase('ready')
    },
    [text, passages.length, setReadingAt],
  )

  const open = (id: string) => {
    audio.stop()
    setOpenId(id)
    setTyped('')
    setScore(null)
    setReveal(false)
    setPhase('ready')
  }

  useEffect(() => () => audio.stop(), [])

  /** Пробіл під час прослуховування скролив би сторінку. */
  useEffect(() => {
    if (phase !== 'playing') return
    const stop = (e: KeyboardEvent) => {
      if (e.code === 'Space') e.preventDefault()
    }
    window.addEventListener('keydown', stop)
    return () => window.removeEventListener('keydown', stop)
  }, [phase])

  const head = (
    <PageHead
      call={callsFor(lang).reading}
      title={t.title}
      lead={t.lead}
      aside={
        <Link className="btn btn--ghost" to="/learn">
          {t.backToKoch}
        </Link>
      }
    />
  )

  /* ---------- вибір тексту ---------- */

  if (!text) {
    return (
      <div className="page shell">
        {head}
        <div className="feats">
          {TEXTS.map((item) => {
            const total = passagesOf(prepareFor(item.body, table).text, WORDS_PER_PASSAGE).length
            const seen = Math.min(progress.reading[item.id] ?? 0, total)
            return (
              <button type="button" className="card feat rd__pick" key={item.id} onClick={() => open(item.id)}>
                <span className="feat__code mono">{item.year}</span>
                <h3 className="h3">{item.title}</h3>
                <p>
                  {item.author} · {t.licence}
                </p>
                <span className="micro">
                  {seen > 0 ? t.progress(seen, total) : t.passages(total)}
                </span>
              </button>
            )
          })}
        </div>

        <p className="lsn__note">{t.corpusNote}</p>
      </div>
    )
  }

  /* ---------- читання ---------- */

  return (
    <div className="page shell">
      {head}

      <div className="rd__meta">
        <button type="button" className="btn btn--quiet" onClick={() => setOpenId(null)}>
          {t.allTexts}
        </button>
        <span className="rd__title">
          <b>{text.title}</b>
          <span className="micro">
            {text.author} · {text.year} · {t.licence}
          </span>
        </span>
        <a className="micro rd__src" href={text.source.url} target="_blank" rel="noreferrer noopener">
          {text.source.name} ↗
        </a>
      </div>

      {/* ---------- режим ---------- */}
      <div className="lsn__modes" role="group" aria-label={t.modeAria}>
        {MODES[lang].map((item) => (
          <button
            key={item.id}
            type="button"
            className="lsn__mode"
            data-active={mode === item.id ? '' : undefined}
            onClick={() => setMode(item.id)}
          >
            <b className="micro">{item.label}</b>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>

      <div className="lsn">
        <div className="lsn__head">
          <span className="micro micro--accent">
            {mode === 'send'
              ? t.keyItByHand
              : phase === 'playing'
                ? t.sounding
                : phase === 'typing'
                  ? t.writeWhatYouHeard
                  : phase === 'checked'
                    ? t.result
                    : t.readyToSend}
          </span>
          <span className="micro">{t.passageOf(at + 1, passages.length)}</span>
        </div>

        {blocked && <p className="lsn__note">{t.audioBlocked}</p>}

        {prepared.dropped > 0 && <p className="lsn__note">{t.dropped(prepared.dropped)}</p>}

        {/* ---------- передавання: текст видно, розшифровка — тільки в кінці ---------- */}
        {mode === 'send' ? (
          <SendPad
            target={passage}
            table={table}
            wpm={wpm}
            effective={spacing}
            freq={freq}
            volume={volume}
            onScored={onSent}
            onNext={() => goTo(at + 1)}
            nextLabel={at >= passages.length - 1 ? t.startOver : t.nextPassage}
          />
        ) : (
        <form
          className="lsn__form"
          onSubmit={(e) => {
            e.preventDefault()
            if (phase === 'checked') goTo(at + 1)
            else if (phase === 'ready') void speak(passage)
            else check()
          }}
        >
          <input
            ref={input}
            className="lsn__input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={phase === 'ready' ? t.pressSendFirst : t.typeHere}
            spellCheck={false}
            autoComplete="off"
            aria-label={t.heardAria}
            disabled={phase === 'ready' || phase === 'checked'}
          />

          <div className="lsn__actions">
            {phase === 'ready' && (
              <button type="submit" className="btn btn--accent">
                {t.send}
              </button>
            )}
            {(phase === 'playing' || phase === 'typing') && (
              <>
                <button type="submit" className="btn btn--accent" disabled={typed.length === 0}>
                  {t.check}
                </button>
                <button type="button" className="btn btn--quiet" onClick={() => void speak(passage)}>
                  {t.repeat}
                </button>
              </>
            )}
            {phase === 'checked' && !done && (
              <button type="submit" className="btn btn--accent">
                {t.nextPassage}
              </button>
            )}
            {phase === 'checked' && done && (
              <button type="button" className="btn btn--accent" onClick={() => goTo(0)}>
                {t.textDone}
              </button>
            )}
            {phase !== 'checked' && (
              <button type="button" className="btn btn--quiet" onClick={() => setReveal(true)}>
                {t.showText}
              </button>
            )}
          </div>
        </form>
        )}

        {/* У передаванні зразок показує сам SendPad — його ж і треба відстукати. */}
        {mode === 'copy' && (reveal || phase === 'checked') && (
          <p className="rd__passage" aria-live="polite">
            {passage}
          </p>
        )}

        {mode === 'copy' && score && (
          <div className="lsn__result">
            <div className="lsn__cells" aria-hidden="true">
              {score.cells.map((cell, i) => (
                <span key={i} className="lsn__cell" data-ok={cell.ok ? '' : undefined}>
                  <b>{cell.target || '·'}</b>
                  <span>{cell.ok ? '' : cell.typed || '—'}</span>
                </span>
              ))}
            </div>
            <p className="lsn__tally">
              {score.hit} / {score.total} — {Math.round(score.rate * 100)}%
            </p>
          </div>
        )}

        <div className="rd__nav">
          <button type="button" className="btn btn--quiet" onClick={() => goTo(at - 1)} disabled={at <= 0}>
            {t.prev}
          </button>
          <span className="rd__dots" aria-hidden="true">
            {passages.map((_, i) => (
              <i key={i} data-here={i === at ? '' : undefined} data-past={i < at ? '' : undefined} />
            ))}
          </span>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => goTo(at + 1)}
            disabled={at >= passages.length - 1}
          >
            {t.next}
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
        <Slider
          label={t.charSpeed}
          value={wpm}
          min={10}
          max={35}
          step={1}
          unit=" WPM"
          onChange={setWpm}
        />
        <Slider
          label={t.effective}
          value={spacing}
          min={5}
          max={35}
          step={1}
          unit=" WPM"
          onChange={setEffective}
        />
        <Slider label={t.tone} value={freq} min={400} max={1000} step={10} unit=" Hz" onChange={setFreq} />
      </div>
    </div>
  )
}
