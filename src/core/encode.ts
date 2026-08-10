import type { MorseTable } from './types'

export const UNKNOWN = '<?>'

/**
 * Скільком символам тексту ця таблиця не має коду.
 *
 * Потрібно, щоб порівняти таблиці між собою: кирилиця в латинській дає `<?>`
 * на кожній літері, і замість стіни знаків питання краще одразу запропонувати
 * ту таблицю, яка цей текст кодує.
 */
export function unsupportedCount(text: string, table: MorseTable): number {
  let missing = 0
  for (const raw of text.toUpperCase()) {
    if (/\s/.test(raw)) continue
    if (!table.chars[raw]) missing++
  }
  return missing
}

/** 'SOS' → ['...', '---', '...'] ; невідомий символ → UNKNOWN, решта не ламається. */
export function encodeChars(text: string, table: MorseTable): string[] {
  return [...text.toUpperCase()].map((ch) => table.chars[ch] ?? UNKNOWN)
}

/** 'SOS' → '... --- ...' */
export function encodeText(
  text: string,
  table: MorseTable,
  letterSep = ' ',
  wordSep = ' / ',
): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => encodeChars(word, table).join(letterSep))
    .join(wordSep)
}
