import { useCallback, useState } from 'react'

import type { Cell, SendCell } from '../core/drill'
import { clampLevel, type CharStat } from '../core/koch'

/**
 * Прогрес навчання.
 *
 * Лежить у localStorage і нікуди не синхронізується — це те саме обіцяне
 * «нічого не покидає пристрій», тільки на практиці. Звідси й наслідок, який
 * треба прийняти чесно: між браузерами прогрес не переноситься.
 *
 * Сховище може кинути виняток — приватний режим, вичерпана квота, вимкнені
 * дані сайтів. Тренажер від цього не має ламатися: не збереглося, значить
 * працюємо в пам'яті до кінця сеансу.
 */

const KEY = 'morseworld:progress'

/**
 * Три режими уроку — і рівень у кожного свій.
 *
 * Спільний рівень на всі три виглядав розумно, поки не спробуєш: знайомство й
 * приймання просуваються швидко, а рука відстає — передавати виходить кількома
 * уроками нижче. Один рівень або тримав приймання, або підсовував руці літери,
 * яких вона ще не вміє.
 */
export const LESSON_MODES = ['intro', 'send', 'copy'] as const
export type LessonMode = (typeof LESSON_MODES)[number]

export type Progress = {
  /** Рівень Коха окремо в кожному режимі. */
  levels: Record<LessonMode, number>
  /** Приймання: скільки разів літеру чули й скільки разів упізнали. */
  chars: Record<string, CharStat>
  /**
   * Передавання: скільки разів літеру просили відстукати й скільки разів вийшло.
   * Окремо від приймання навмисно — це різні вміння, і розходяться вони сильно:
   * упізнати на слух зазвичай легше, ніж відтворити ритм рукою.
   */
  sent: Record<string, CharStat>
  /** На якому уривку людина зупинилася в кожному тексті. */
  reading: Record<string, number>
}

const START: Record<LessonMode, number> = { intro: 1, send: 1, copy: 1 }

const EMPTY: Progress = { levels: START, chars: {}, sent: {}, reading: {} }

function isStat(value: unknown): value is CharStat {
  if (typeof value !== 'object' || value === null) return false
  const stat = value as Record<string, unknown>
  return typeof stat.seen === 'number' && typeof stat.hit === 'number'
}

/** Читаємо недовірливо: у сховищі могло лежати що завгодно, зокрема старий формат. */
function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return EMPTY
    const data = parsed as Record<string, unknown>

    const stats = (raw: unknown): Record<string, CharStat> => {
      const out: Record<string, CharStat> = {}
      if (typeof raw !== 'object' || raw === null) return out
      for (const [char, stat] of Object.entries(raw)) {
        if (isStat(stat) && stat.seen > 0) out[char] = { seen: stat.seen, hit: stat.hit }
      }
      return out
    }

    const reading: Record<string, number> = {}
    if (typeof data.reading === 'object' && data.reading !== null) {
      for (const [id, at] of Object.entries(data.reading)) {
        if (typeof at === 'number' && at >= 0) reading[id] = Math.floor(at)
      }
    }

    // Раніше рівень був один на всі режими. Старе значення не викидаємо:
    // ним засівається кожен режим, тому прогрес не обнуляється на оновленні.
    const legacy = typeof data.kochLevel === 'number' ? clampLevel(data.kochLevel) : 1
    const stored = typeof data.levels === 'object' && data.levels !== null
      ? (data.levels as Record<string, unknown>)
      : {}

    const levels = { ...START }
    for (const mode of LESSON_MODES) {
      const value = stored[mode]
      levels[mode] = typeof value === 'number' ? clampLevel(value) : legacy
    }

    return { levels, chars: stats(data.chars), sent: stats(data.sent), reading }
  } catch {
    return EMPTY
  }
}

function save(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    /* не збереглося — працюємо в пам'яті */
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load)

  const update = useCallback((change: (current: Progress) => Progress) => {
    setProgress((current) => {
      const next = change(current)
      save(next)
      return next
    })
  }, [])

  const setLevel = useCallback(
    (mode: LessonMode, level: number) =>
      update((p) => ({ ...p, levels: { ...p.levels, [mode]: clampLevel(level) } })),
    [update],
  )

  /** Одна й та сама арифметика на обидва напрямки: почуте й відстукане. */
  const bump = (into: Record<string, CharStat>, char: string, ok: boolean) => {
    const before = into[char] ?? { seen: 0, hit: 0 }
    into[char] = { seen: before.seen + 1, hit: before.hit + (ok ? 1 : 0) }
  }

  /**
   * Приймання. Рахуємо тільки те, що справді прозвучало: лишній символ,
   * вписаний людиною, не належить жодній літері уроку.
   */
  const recordChars = useCallback(
    (cells: Cell[]) =>
      update((p) => {
        const chars = { ...p.chars }
        for (const cell of cells) {
          if (cell.target === '' || cell.target === ' ') continue
          bump(chars, cell.target, cell.ok)
        }
        return { ...p, chars }
      }),
    [update],
  )

  /** Передавання. Так само рахуємо лише те, що просили передати. */
  const recordSent = useCallback(
    (cells: SendCell[]) =>
      update((p) => {
        const sent = { ...p.sent }
        for (const cell of cells) {
          if (!cell.want || cell.want.char === ' ') continue
          bump(sent, cell.want.char, cell.ok)
        }
        return { ...p, sent }
      }),
    [update],
  )

  const setReadingAt = useCallback(
    (id: string, at: number) =>
      update((p) => ({ ...p, reading: { ...p.reading, [id]: Math.max(0, at) } })),
    [update],
  )

  const resetChars = useCallback(() => update((p) => ({ ...p, chars: {}, sent: {} })), [update])

  return { progress, setLevel, recordChars, recordSent, setReadingAt, resetChars }
}
