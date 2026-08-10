import type { MorseTable } from './types'
import { UNKNOWN } from './encode'

/** Зворотна мапа '.-' → 'A'. Будується один раз на таблицю. */
export function reverseMap(table: MorseTable): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [ch, code] of Object.entries(table.chars)) out[code] ??= ch
  return out
}

/** Ввід вважається морзянкою, якщо в ньому лише . - / та пробіли. */
export function looksLikeMorse(input: string): boolean {
  const s = input.trim()
  return s.length > 0 && /^[.\-·−/\s|]+$/.test(s)
}

/**
 * Чи введене **однозначно** морзянка — настільки, щоб перемкнути напрям само.
 *
 * Суворіше за `looksLikeMorse` навмисно. Одна крапка, тире або три крапки
 * поспіль — це ще й звичайна пунктуація: багатокрапка в тексті не має
 * викидати людину в режим розшифровки посеред слова. Тому потрібне або
 * кілька груп, розділених пробілом, або хоча б чотири знаки підряд — стільки
 * випадково не набирають.
 */
const ENOUGH_ELEMENTS = 4

export function readsAsMorse(input: string): boolean {
  if (!looksLikeMorse(input)) return false
  const groups = input.trim().split(/[\s/|]+/).filter(Boolean)
  if (groups.length > 1) return true
  return (groups[0] ?? '').length >= ENOUGH_ELEMENTS
}

/**
 * Чи введене — текст, а не морзянка. Тут навпаки достатньо однієї ознаки:
 * у кодах не буває ні літер, ні цифр, тому будь-яка з них знімає сумнів.
 */
export function readsAsText(input: string): boolean {
  return /[\p{L}\p{N}]/u.test(input)
}

/** '... --- ...' → 'SOS'. Невідомий код → UNKNOWN, решта не ламається. */
export function decodeMorse(input: string, table: MorseTable): string {
  const rev = reverseMap(table)
  return input
    .replace(/[·]/g, '.')
    .replace(/[−–—]/g, '-')
    .trim()
    .split(/\s*[/|]\s*/)
    .map((word) =>
      word
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => rev[code] ?? UNKNOWN)
        .join(''),
    )
    .join(' ')
}
