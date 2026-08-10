import type { Gaps } from './timing'

/**
 * Крок відтворення. `index` — позиція символу в рядку морзе, з якого крок
 * походить; саме за ним інтерфейс підсвічує те, що вже прозвучало.
 */
export type PlayStep = { index: number; on: boolean; ms: number }

const DOT = '.'
const DASH = '-'

/** '·' і '−' зустрічаються в тексті частіше, ніж ASCII — приводимо до одного вигляду. */
export function normalizeMorse(morse: string): string {
  return morse.replace(/[·•]/g, DOT).replace(/[−–—]/g, DASH)
}

function isElement(ch: string | undefined): boolean {
  return ch === DOT || ch === DASH
}

/**
 * Рядок морзе → послідовність кроків «звук / тиша».
 * Індекси лишаються від вихідного рядка, тому підсвічування збігається
 * символ у символ із тим, що показано на екрані.
 */
export function morseToSteps(morse: string, gaps: Gaps): PlayStep[] {
  const src = normalizeMorse(morse)
  const steps: PlayStep[] = []

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (!isElement(ch)) continue

    steps.push({ index: i, on: true, ms: ch === DOT ? gaps.element : gaps.element * 3 })

    // Що йде далі визначає довжину паузи: елемент, літера чи слово.
    let j = i + 1
    let sawSpace = false
    let sawSlash = false
    while (j < src.length && !isElement(src[j])) {
      if (src[j] === '/' || src[j] === '|') sawSlash = true
      else if (src[j] === ' ' || src[j] === '\n' || src[j] === '\t') sawSpace = true
      j++
    }

    if (j >= src.length) break // після останнього елемента пауза не потрібна

    const ms = sawSlash ? gaps.word : sawSpace ? gaps.letter : gaps.element
    steps.push({ index: i, on: false, ms })
  }

  return steps
}
