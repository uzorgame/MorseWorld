import type { MorseTable } from '../core/types'
import { international } from '../core/tables/international'
import { cyrillic } from '../core/tables/cyrillic'
import type { Lang } from '../state/lang'

/**
 * Тексти запуску сайту. Морзянка не прописана руками, а рахується з цих слів
 * тією ж таблицею, якою її потім і озвучують, — тому побачене й почуте
 * завжди збігаються.
 *
 * Таблиця тільки з тих, які інтерфейс справді пропонує. Раніше тут стояла
 * українська — та сама, яку перемикач ховає, бо вона не звірена з першоджерелом.
 * Виходило, що правило «неперевірене не підсовуємо» діяло всюди, крім першого,
 * що чує гість. Тому слова підібрані так, щоб їх покривала базова кирилична:
 * без `І`, `Ї`, `Є`, `Ґ`, яких у ній немає.
 */

export type BootLine = {
  /** Що видно після захоплення сигналу. */
  text: string
  /** Що передається морзянкою: без розділових знаків. */
  word: string
}

export type BootCopy = {
  table: MorseTable
  lines: BootLine[]
  stamp: string
  input: string
  carrier: string
  clarity: string
  scanning: string
  locked: string
  skip: string
  /** Для читачів екрана: що взагалі відбувається, поки карта на екрані. */
  aria: string
  dial: Array<{ wpm: string; label: string }>
}

export const BOOT: Record<Lang, BootCopy> = {
  uk: {
    table: cyrillic,
    lines: [
      { text: 'Гей.', word: 'Гей' },
      { text: 'Чую тебе.', word: 'Чую тебе' },
      { text: 'А ти мене?', word: 'А ти мене' },
    ],
    stamp: 'MORSEWORLD · ITU-R M.1677-1 · 2026',
    input: 'ВХІД',
    carrier: 'CARRIER 600 Hz',
    clarity: 'ЧИСТОТА СИГНАЛУ',
    scanning: '● ПОШУК СИГНАЛУ',
    locked: '● СИГНАЛ ЗАХОПЛЕНО',
    skip: 'ESC — ПРОПУСТИТИ',
    aria: 'Пошук сигналу — завантаження',
    dial: [
      { wpm: '05', label: 'СЛУХАЮ' },
      { wpm: '12', label: 'ЛЕГКО' },
      { wpm: '20', label: 'НОРМА' },
      { wpm: '28', label: 'ШВИДКО' },
      { wpm: '40', label: 'ЕФІР' },
    ],
  },
  en: {
    table: international,
    lines: [
      { text: 'Hey.', word: 'Hey' },
      { text: 'Can you', word: 'Can you' },
      { text: 'hear me?', word: 'hear me' },
    ],
    stamp: 'MORSEWORLD · ITU-R M.1677-1 · 2026',
    input: 'INPUT',
    carrier: 'CARRIER 600 Hz',
    clarity: 'SIGNAL CLARITY',
    scanning: '● SEARCHING FOR SIGNAL',
    locked: '● SIGNAL LOCKED',
    skip: 'ESC — SKIP',
    aria: 'Searching for signal — loading',
    dial: [
      { wpm: '05', label: 'LISTENING' },
      { wpm: '12', label: 'EASY' },
      { wpm: '20', label: 'NORMAL' },
      { wpm: '28', label: 'FAST' },
      { wpm: '40', label: 'ON AIR' },
    ],
  },
}
