import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { encodeText } from '../../core/encode'
import { morseToSteps } from '../../core/schedule'
import { international } from '../../core/tables/international'
import { audio } from '../../audio/MorseAudio'
import { BOOT } from '../../i18n/boot'
import { useLang } from '../../state/lang'
import './boot.css'

/**
 * Запуск сайту: «SIGNAL ACQUISITION».
 * Тест-карта приймача — сітка, приціли, шкала частот, — яка ловить сигнал
 * і резолвиться з морзе в текст. Пропускається кліком, клавішею або скролом.
 */

export type BootPhase = 'carrier' | 'scan' | 'lock' | 'handoff' | 'done'

const TIMELINE: Array<[BootPhase, number]> = [
  ['scan', 500],
  ['lock', 1600],
  ['handoff', 2900],
  ['done', 3600],
]

/** Скільки часу є в повідомлення, щоб прозвучати до передавання керування. */
const AUDIO_WINDOW = 2400
const TONE = 600
const VOLUME = 0.2

const CROSSHAIRS = [
  { x: '11%', d: '0ms', code: '·−' },
  { x: '31%', d: '90ms', code: '−·−' },
  { x: '69%', d: '40ms', code: '···' },
  { x: '90%', d: '150ms', code: '−−·' },
]

const PRETTY = (morse: string) => morse.replace(/\./g, '·').replace(/-/g, '−')

/**
 * Бігучий рядок. Морзянку тут **рахуємо**, а не вписуємо руками.
 *
 * Вписана колись давала `·−·· ·· ·−·· ·−·· ·−·` — тобто «LILLR» — і стояло це
 * поруч зі словом MORSE, ніби його й означало. У сайті, чия головна обіцянка —
 * точність кодів, декоративна морзянка мусить бути справжньою так само, як
 * робоча: інакше перше, що бачить гість, — неправильний код.
 */
const MARQUEE_WORD = 'MORSE'
const MARQUEE = `${PRETTY(encodeText(MARQUEE_WORD, international))} — 600 Hz — 20 WPM — ITU-R M.1677-1 — ${MARQUEE_WORD} — `

/** ?bootspeed=4 розтягує весь запуск у 4 рази — щоб малювати кадри, а не ловити їх. */
function speedFactor(): number {
  const raw = new URLSearchParams(window.location.search).get('bootspeed')
  const n = raw ? Number(raw) : 1
  return Number.isFinite(n) && n > 0 ? n : 1
}

/** ?bootphase=lock зупиняє запуск на конкретній фазі — для перегляду кадру. */
function frozenPhase(): BootPhase | null {
  const raw = new URLSearchParams(window.location.search).get('bootphase')
  const all: BootPhase[] = ['carrier', 'scan', 'lock', 'handoff', 'done']
  return raw && (all as string[]).includes(raw) ? (raw as BootPhase) : null
}

type Props = {
  onFinish: () => void
  /** Викликається на початку «handoff» — сайт під картою можна показувати. */
  onReveal: () => void
}

export function BootSequence({ onFinish, onReveal }: Props) {
  const { lang } = useLang()
  const copy = BOOT[lang]

  const speed = useRef(speedFactor()).current
  const frozen = useRef(frozenPhase()).current
  const [phase, setPhase] = useState<BootPhase>(frozen ?? 'carrier')

  const finished = useRef(false)
  const revealed = useRef(false)

  // Морзянку рахуємо з тих самих слів, які потім покажемо текстом.
  const lines = useMemo(
    () => copy.lines.map((l) => ({ ...l, morse: encodeText(l.word, copy.table) })),
    [copy],
  )

  /** Темп добираємо так, щоб фраза встигла прозвучати рівно до кінця запуску. */
  const steps = useMemo(() => {
    const phrase = lines.map((l) => l.morse).join(' / ')
    const units = morseToSteps(phrase, { element: 1, letter: 3, word: 7 }).reduce(
      (sum, s) => sum + s.ms,
      0,
    )
    if (!units) return []
    const unit = Math.min(60, Math.max(16, AUDIO_WINDOW / units))
    return morseToSteps(phrase, { element: unit, letter: unit * 3, word: unit * 7 })
  }, [lines])

  const reveal = useCallback(() => {
    if (revealed.current) return
    revealed.current = true
    onReveal()
  }, [onReveal])

  const finish = useCallback(() => {
    reveal()
    if (finished.current) return
    finished.current = true
    onFinish()
  }, [onFinish, reveal])

  const skip = useCallback(() => {
    audio.stop()
    setPhase('handoff')
    reveal()
    window.setTimeout(finish, 420)
  }, [finish, reveal])

  useEffect(() => {
    if (frozen) {
      if (frozen === 'handoff' || frozen === 'done') reveal()
      return
    }
    const timers = TIMELINE.map(([next, at]) =>
      window.setTimeout(
        () => {
          setPhase(next)
          if (next === 'handoff') reveal()
          if (next === 'done') finish()
        },
        at * speed,
      ),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [finish, reveal, speed, frozen])

  // Звук вмикається сам. Якщо браузер його поки не пускає, чекаємо на дозвіл
  // мовчки й заграємо тієї ж миті, коли він з'явиться, — без кнопок і питань.
  useEffect(() => {
    if (frozen || steps.length === 0) return
    let cancelled = false

    const start = () => {
      if (!cancelled) audio.play(steps, { freq: TONE, volume: VOLUME })
    }

    const off = audio.onRunning(start)
    void audio.unlock().then((ok) => {
      if (ok) start()
    })

    return () => {
      cancelled = true
      off()
      audio.stop()
    }
  }, [steps, frozen])

  useEffect(() => {
    if (frozen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', skip, { once: true, passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', skip)
    }
  }, [skip, frozen])

  const locked = phase === 'lock' || phase === 'handoff' || phase === 'done'

  return (
    <div
      className="boot"
      style={{ '--sp': speed } as React.CSSProperties}
      data-phase={phase}
      role="status"
      aria-live="polite"
      aria-label={copy.aria}
      onClick={skip}
    >
      <div className="boot__grid" aria-hidden="true" />

      <div className="boot__ghost" aria-hidden="true">
        <span>MORSE</span>
      </div>

      <div className="boot__glyphs" aria-hidden="true">
        <span className="g g--dot g--a" />
        <span className="g g--dash g--b" />
        <span className="g g--dot g--c" />
        <span className="g g--dash g--d" />
        <span className="g g--dot g--e" />
        <span className="g g--dash g--f" />
      </div>

      <div className="boot__marquees" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div className="boot__marquee" key={i} style={{ '--i': i } as React.CSSProperties}>
            <span>{MARQUEE.repeat(4)}</span>
            <span>{MARQUEE.repeat(4)}</span>
          </div>
        ))}
      </div>

      <div className="boot__crosshairs" aria-hidden="true">
        {CROSSHAIRS.map((c) => (
          <i
            key={c.x}
            style={{ '--x': c.x, '--d': c.d } as React.CSSProperties}
            data-code={c.code}
          />
        ))}
      </div>

      <div className="boot__frame" aria-hidden="true">
        <span className="boot__corner boot__corner--tl" />
        <span className="boot__corner boot__corner--tr" />
        <span className="boot__corner boot__corner--bl" />
        <span className="boot__corner boot__corner--br" />
      </div>

      <div className="boot__side boot__side--l" aria-hidden="true">
        <span className="micro">{copy.input}</span>
        <div className="boot__scope">
          <span className="boot__blip" />
          <span className="boot__blip" />
          <span className="boot__blip" />
        </div>
        <span className="micro">{copy.carrier}</span>
      </div>

      <div className="boot__side boot__side--r" aria-hidden="true">
        <span className="micro">{copy.clarity}</span>
        <div className="boot__bars">
          {Array.from({ length: 8 }, (_, i) => (
            <b key={i} style={{ '--b': i } as React.CSSProperties} />
          ))}
        </div>
        <span className="micro">{locked ? 'LOCK' : 'SCAN'}</span>
      </div>

      <div className="boot__stage">
        <div className="boot__stamp micro">{copy.stamp}</div>

        <p className="boot__message">
          {lines.map((line, i) => (
            <span className="boot__line" key={line.text} style={{ '--l': i } as React.CSSProperties}>
              <span className="boot__line-morse mono" aria-hidden="true">
                {PRETTY(line.morse)}
              </span>
              <span className="boot__line-text">{line.text}</span>
            </span>
          ))}
        </p>

        <div className="boot__status micro">
          <span data-when="scan">{copy.scanning}</span>
          <span data-when="lock">{copy.locked}</span>
        </div>
      </div>

      <div className="boot__dial">
        <div className="boot__dial-head">
          <span className="micro">WPM</span>
          <span className="boot__progress">
            <b />
          </span>
          <span className="micro boot__skip">{copy.skip}</span>
        </div>
        <div className="boot__ticks" aria-hidden="true">
          {Array.from({ length: 61 }, (_, i) => (
            <i key={i} data-major={i % 15 === 0 ? '' : undefined} />
          ))}
          <span className="boot__needle" />
        </div>
        <div className="boot__dial-labels" aria-hidden="true">
          {copy.dial.map((d) => (
            <span key={d.wpm} className="micro">
              <b className="mono">{d.wpm}</b> {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
