/**
 * Намір, з яким користувач іде в перекладач із меню.
 *
 * Перехід може статися з іншої сторінки, тому намір мусить пережити монтування:
 * тримаємо його в модулі, а перекладач забирає при появі.
 */

export type TranslatorIntent = 'encode' | 'decode' | 'play'

const EVENT = 'morseworld:translator-intent'

let pending: TranslatorIntent | null = null

export function requestTranslator(intent: TranslatorIntent): void {
  pending = intent
  window.dispatchEvent(new CustomEvent<TranslatorIntent>(EVENT, { detail: intent }))
}

/** Забирає намір, що чекав переходу. Другий виклик уже нічого не дасть. */
export function takePendingIntent(): TranslatorIntent | null {
  const intent = pending
  pending = null
  return intent
}

export function onTranslatorIntent(cb: (intent: TranslatorIntent) => void): () => void {
  const handler = (e: Event) => {
    pending = null
    cb((e as CustomEvent<TranslatorIntent>).detail)
  }
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
