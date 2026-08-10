/**
 * Підготовка звичайного тексту до передачі морзянкою.
 *
 * Морзянка не знає регістру й вміє далеко не всі розділові знаки. Те, чого
 * в таблиці немає, треба прибрати **до** кодування, а не після: інакше
 * encodeText поставить на місце такого символу `<?>`, і в звуці утвориться
 * німа діра, якої людина ніяк не зможе почути й повторити.
 */

import type { MorseTable } from './types'

/** Що з типографіки зводиться до знаків, які в таблиці справді є. */
const FOLD: Record<string, string> = {
  '’': "'",
  '‘': "'",
  '“': '"',
  '”': '"',
  '—': ' ',
  '–': ' ',
  '…': '.',
  ' ': ' ',
  ';': ',',
  ':': ',',
  '!': '.',
}

export type Prepared = {
  /** Текст, який точно кодується цією таблицею. */
  text: string
  /** Скільки символів довелося прибрати — щоб не робити цього молчки. */
  dropped: number
}

export function prepareFor(source: string, table: MorseTable): Prepared {
  const upper = source.toUpperCase()
  let out = ''
  let dropped = 0

  for (const raw of upper) {
    const ch = FOLD[raw] ?? raw
    if (ch === ' ' || ch === '\n' || ch === '\t') {
      out += ' '
      continue
    }
    if (table.chars[ch]) out += ch
    else dropped++
  }

  return { text: out.replace(/\s+/g, ' ').trim(), dropped }
}

/**
 * Розбивка на короткі уривки.
 *
 * Довгий абзац морзянкою прослухати неможливо: до кінця людина забуде початок,
 * і тренування перетвориться на перевірку пам'яті замість слуху. Тому ріжемо
 * на кілька слів, і межа проходить по слову, а не по символу.
 */
export function passagesOf(text: string, wordsPerPassage: number): string[] {
  const words = text.split(' ').filter(Boolean)
  const size = Math.max(1, wordsPerPassage)
  const out: string[] = []

  for (let i = 0; i < words.length; i += size) {
    out.push(words.slice(i, i + size).join(' '))
  }

  return out
}
