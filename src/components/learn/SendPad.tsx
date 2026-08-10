import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { audio } from '../../audio/MorseAudio'
import { scoreSending, type SendScore, type Sign } from '../../core/drill'
import { UNKNOWN, encodeText } from '../../core/encode'
import { reverseMap } from '../../core/decode'
import { groupStrokes, sendingThresholds, type Letter, type Stroke } from '../../core/keyDecoder'
import { morseToSteps } from '../../core/schedule'
import { gapsFor } from '../../core/timing'
import type { MorseTable } from '../../core/types'
import { useLang } from '../../state/lang'
import { useStraightKey } from '../practice/useStraightKey'

/**
 * Передавання за зразком.
 *
 * На екрані — літера або слово **текстом**. Ритм дістається з пам'яті, а не
 * зчитується з наведеного поруч коду: інакше вправа вчила б читати схеми, а не
 * передавати. Код доступний кнопкою, і це навмисно окрема дія.
 *
 * Поки людина стукає, показуються тільки крапки й тире — без розшифровки.
 * Мета відома наперед, тому вгадувати межі літер не потрібно: пороги беруться
 * з обраної швидкості, а розбір робиться один раз, коли передачу завершено.
 */

const PRETTY = (code: string) => code.replace(/\./g, '·').replace(/-/g, '−')

const STRINGS = {
  uk: {
    sendThis: 'ПЕРЕДАЙТЕ ЦЕ',
    showCode: 'Показати код',
    hideCode: 'Сховати код',
    codeHidden: 'КОД СХОВАНО — РИТМ БЕРЕТЬСЯ З ПАМʼЯТІ',
    limits: (dash: number, letter: number) =>
      `ТИРЕ — ДОВШЕ ЗА ${dash} МС · НОВА ЛІТЕРА — ПАУЗА ВІД ${letter} МС`,
    wordGapsNotScored: 'ПАУЗИ МІЖ СЛОВАМИ НЕ ОЦІНЮЮТЬСЯ',
    padAria: 'Телеграфний ключ',
    checked: 'ПЕРЕДАЧУ ЗВІРЕНО',
    sending: 'ПЕРЕДАЮ',
    holdKeys: 'ТРИМАЙТЕ: ПРОБІЛ · ENTER · МИША · ДОТИК',
    ribbonEmpty: 'СТРІЧКА ПОРОЖНЯ',
    doneCheck: 'Готово — звірити',
    eraseAll: 'Стерти все',
    sameAgain: 'Ще раз це саме',
    hearReference: 'Почути еталон',
    backspaceTip: 'BACKSPACE СТИРАЄ ОСТАННІЙ ЗНАК',
    ackLabel: 'R · ПРИЙНЯВ, ПЕРЕПИТУВАТИ НІЧОГО',
    ackBody: 'Ритм збігся з еталоном по кожній літері',
    extra: 'зайве',
    missed: 'пропуск',
    decodedAs: 'Ваша передача розшифрувалася як',
  },
  en: {
    sendThis: 'SEND THIS',
    showCode: 'Show the code',
    hideCode: 'Hide the code',
    codeHidden: 'CODE HIDDEN — THE RHYTHM COMES FROM MEMORY',
    limits: (dash: number, letter: number) =>
      `DASH — LONGER THAN ${dash} MS · NEW LETTER — GAP FROM ${letter} MS`,
    wordGapsNotScored: 'WORD GAPS ARE NOT SCORED',
    padAria: 'Telegraph key',
    checked: 'TRANSMISSION CHECKED',
    sending: 'SENDING',
    holdKeys: 'HOLD: SPACE · ENTER · MOUSE · TOUCH',
    ribbonEmpty: 'RIBBON IS EMPTY',
    doneCheck: 'Done — check it',
    eraseAll: 'Erase everything',
    sameAgain: 'The same one again',
    hearReference: 'Hear the reference',
    backspaceTip: 'BACKSPACE ERASES THE LAST SIGN',
    ackLabel: 'R · RECEIVED, NOTHING TO REPEAT',
    ackBody: 'The rhythm matched the reference on every letter',
    extra: 'extra',
    missed: 'missed',
    decodedAs: 'Your transmission decoded as',
  },
} as const

/**
 * Межі слів навмисно **не** оцінюються.
 *
 * Структура слів у зразку відома наперед — її не треба виводити з паузи. А коли
 * її виводили, кожна довга пауза «на пригадування» ставала межею слова, і
 * система виставляла рахунок за власну догадку: передача правильних літер
 * розсипалася на слова з однієї літери, а в звірку сипалися зайві знаки-межі.
 * Тому тут звіряються самі літери — рівно те вміння, яке ця вправа тренує.
 */
function wantedSigns(text: string, table: MorseTable): Sign[] {
  const out: Sign[] = []
  for (const char of text.toUpperCase()) {
    const code = table.chars[char]
    if (code) out.push({ char, code })
  }
  return out
}

function keyedSigns(letters: Letter[], table: MorseTable): Sign[] {
  const back = reverseMap(table)
  return letters
    .filter((letter) => letter.code.length > 0)
    .map((letter) => ({ char: back[letter.code] ?? UNKNOWN, code: letter.code }))
}

type Props = {
  /** Що передати. Зміна зразка скидає стрічку. */
  target: string
  table: MorseTable
  /** Швидкість знаків: від неї межа крапка/тире. */
  wpm: number
  /** Ефективна швидкість: від неї межі пауз. */
  effective: number
  freq: number
  volume: number
  onScored: (score: SendScore) => void
  /** Наступне завдання. Кнопка зʼявляється лише після звірки. */
  onNext: () => void
  nextLabel: string
}

export function SendPad({
  target,
  table,
  wpm,
  effective,
  freq,
  volume,
  onScored,
  onNext,
  nextLabel,
}: Props) {
  const { lang } = useLang()
  const t = STRINGS[lang]

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [score, setScore] = useState<SendScore | null>(null)
  // Код відкритий одразу: людині, яка щойно прийшла, нізвідки знати, що його
  // взагалі можна показати. Хто вже пам'ятає ритм — закриє його однією кнопкою.
  const [hint, setHint] = useState(true)

  const thresholds = useMemo(() => sendingThresholds(wpm, effective), [wpm, effective])
  const wanted = useMemo(() => wantedSigns(target, table), [target, table])

  const { pressed, press, release, reset } = useStraightKey({
    freq,
    volume,
    enabled: score === null,
    onStroke: (stroke) => setStrokes((list) => [...list, stroke]),
  })

  /** Новий зразок — чистий аркуш. Підказку не гасимо: її стан обирає людина. */
  useEffect(() => {
    audio.stop()
    reset()
    setStrokes([])
    setScore(null)
  }, [target, reset])

  useEffect(() => () => audio.stop(), [])

  const letters = useMemo(() => groupStrokes(strokes, thresholds), [strokes, thresholds])

  const done = useCallback(() => {
    const result = scoreSending(wanted, keyedSigns(letters, table))
    setScore(result)
    onScored(result)
  }, [wanted, letters, table, onScored])

  /**
   * Правильну передачу визнаємо самі, не чекаючи кнопки.
   *
   * Якщо відстукане вже точно збігається зі зразком, питати «а ти закінчив?»
   * немає сенсу — відповідь видно. Автоматично зараховуємо **тільки повний
   * збіг**: щойно є хоч одна розбіжність, рішення лишається за людиною, бо
   * інакше вправа обривалася б на першій же помилці, замість дати доробити.
   */
  useEffect(() => {
    if (score !== null || strokes.length === 0) return

    const got = keyedSigns(letters, table)
    if (got.length !== wanted.length) return
    if (got.some((sign, i) => sign.code !== wanted[i]?.code)) return

    const result = scoreSending(wanted, got)
    setScore(result)
    onScored(result)
  }, [strokes, letters, wanted, table, score, onScored])

  const won = score !== null && score.total > 0 && score.hit === score.total

  const again = () => {
    reset()
    setStrokes([])
    setScore(null)
  }

  const hear = () => {
    const steps = morseToSteps(encodeText(target, table, ' ', ' / '), gapsFor(wpm))
    audio.play(steps, { freq, volume })
  }

  const undo = () => {
    reset()
    setStrokes((list) => list.slice(0, -1))
  }

  const undoRef = useRef(undo)
  undoRef.current = undo

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace') return
      e.preventDefault()
      undoRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="snd">
      {/* ---------- зразок ---------- */}
      <div className="snd__task">
        <span className="micro">{t.sendThis}</span>
        <b>{target}</b>
      </div>

      <div className="snd__hint">
        <button type="button" className="btn btn--ghost" onClick={() => setHint((on) => !on)}>
          {hint ? t.hideCode : t.showCode}
        </button>
        {hint ? (
          <code className="mono">{PRETTY(encodeText(target, table, ' ', ' / '))}</code>
        ) : (
          <span className="micro">{t.codeHidden}</span>
        )}
      </div>

      {/* Пороги видно навмисно: інакше незрозуміло, чому літера розпалася. */}
      <div className="snd__limits">
        <span className="micro">
          {t.limits(Math.round(thresholds.dashAt), Math.round(thresholds.letterAt))}
        </span>
        <span className="micro">{t.wordGapsNotScored}</span>
      </div>

      {/* ---------- ключ ---------- */}
      <button
        type="button"
        className="snd__pad"
        data-key-pad=""
        data-down={pressed ? '' : undefined}
        disabled={score !== null}
        onPointerDown={(e) => {
          e.preventDefault()
          if (score === null) press(e.timeStamp)
        }}
        onPointerUp={(e) => release(e.timeStamp)}
        onPointerLeave={(e) => release(e.timeStamp)}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={t.padAria}
      >
        <span className="micro">
          {score !== null ? t.checked : pressed ? t.sending : t.holdKeys}
        </span>
      </button>

      {/* ---------- стрічка: тільки крапки й тире ---------- */}
      <div className="snd__ribbon" aria-hidden="true">
        {strokes.length === 0 && !pressed ? (
          <span className="micro snd__empty">{t.ribbonEmpty}</span>
        ) : (
          strokes.map((stroke, i) => {
            const word = i > 0 && stroke.gap >= thresholds.wordAt
            const letter = i > 0 && !word && stroke.gap >= thresholds.letterAt
            return (
              <span className="snd__el" key={i}>
                {word && <b className="snd__sep" data-word="">/</b>}
                {letter && <b className="snd__sep" />}
                <i data-el={stroke.hold >= thresholds.dashAt ? 'dash' : 'dot'} />
              </span>
            )
          })
        )}
        {pressed && <i data-el="live" />}
      </div>

      <div className="snd__actions">
        {score === null ? (
          <>
            <button
              type="button"
              className="btn btn--accent"
              onClick={done}
              disabled={strokes.length === 0}
            >
              {t.doneCheck}
            </button>
            <button type="button" className="btn btn--quiet" onClick={again} disabled={strokes.length === 0}>
              {t.eraseAll}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn--accent" onClick={onNext}>
              {nextLabel}
            </button>
            <button type="button" className="btn btn--quiet" onClick={again}>
              {t.sameAgain}
            </button>
            <button type="button" className="btn btn--quiet" onClick={hear}>
              {t.hearReference}
            </button>
          </>
        )}
        <span className="micro snd__tip">{t.backspaceTip}</span>
      </div>

      {/* ---------- звірка ---------- */}
      {score && (
        <div className="snd__result" data-win={won ? '' : undefined}>
          {/* Підтвердження мовою ефіру: R — «прийняв, зрозумів». Саме це
              радист відповідає на передачу, у якій нічого не перепитувати. */}
          {won && (
            <div className="snd__ack">
              <span className="snd__ack-morse mono" aria-hidden="true">
                ·−·
              </span>
              <span className="snd__ack-body">
                <b className="micro">{t.ackLabel}</b>
                <span>{t.ackBody}</span>
              </span>
              <span className="snd__ack-count mono">
                {score.total}/{score.total}
              </span>
            </div>
          )}
          <div className="snd__cells">
            {score.cells.map((cell, i) => (
              <span className="snd__cell" key={i} data-ok={cell.ok ? '' : undefined}>
                <b>{cell.want?.char ?? '+'}</b>
                <code className="mono">{cell.want ? PRETTY(cell.want.code) : t.extra}</code>
                {!cell.ok && (
                  <code className="mono snd__got">
                    {cell.got ? PRETTY(cell.got.code) : t.missed}
                  </code>
                )}
              </span>
            ))}
          </div>

          {!won && (
            <p className="snd__tally" aria-live="polite">
              {score.hit} / {score.total} — {Math.round(score.rate * 100)}%. {t.decodedAs}{' '}
              <b>{score.cells.map((c) => c.got?.char ?? '').join('')}</b>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
