/**
 * Декодер ручного ключа.
 *
 * Пороги беруться з **обраної швидкості**, а не вимірюються зі стуку.
 *
 * Спроба виміряти їх автоматично тут була, і вона не працює. Причина не в
 * алгоритмі: у живої людини паузи всередині літери й паузи між літерами
 * зливаються в одну суцільну пляму, а не в дві купи. Розділити те, що не
 * розділене, неможливо жодною кластеризацією. Гірше інше — такі пороги
 * повзуть від знака до знака, а до порогу, який рухається, неможливо
 * підлаштуватися. Обрана вручну швидкість стоїть на місці, її видно в
 * мілісекундах, і саме тому їй можна навчитися.
 *
 * Пропорції стандартні: крапка — 1 одиниця, тире — 3, пауза між знаками — 1,
 * між літерами — 3, між словами — 7. Одиниця при заданій швидкості дорівнює
 * 1200 / WPM мілісекунд (PARIS — 50 одиниць на слово).
 */

import { gapsFor } from './timing'

export type Stroke = {
  /** Скільки тривало натискання. */
  hold: number
  /** Скільки тривала тиша перед ним. Для першого знака — 0. */
  gap: number
}

export type Thresholds = {
  /** Від цієї тривалості натискання вважається тире. */
  dashAt: number
  /** Від цієї паузи починається нова літера. */
  letterAt: number
  /** Від цієї паузи починається нове слово. */
  wordAt: number
}

export type Letter = {
  code: string
  strokes: Stroke[]
  wordBreakBefore: boolean
}

/** Межі швидкості в інтерфейсі. */
export const WPM_MIN = 5
export const WPM_MAX = 30

/** Тривалість однієї одиниці: крапка при заданій швидкості. */
export function unitFor(wpm: number): number {
  return 1200 / Math.min(WPM_MAX, Math.max(WPM_MIN, wpm))
}

/** Обернено: яка швидкість дає таку одиницю. */
export function wpmForUnit(unit: number): number {
  return unit > 0 ? 1200 / unit : WPM_MAX
}

/**
 * Пороги зі швидкості.
 *
 * Межа крапка/тире стоїть посередині між 1 і 3 одиницями — там немає з чим
 * помилитися. А от межі пауз узяті **на самих нормативних значеннях**, а не
 * посередині: людина майже завжди тримає паузу всередині літери довшою за
 * одну одиницю, і поріг посередині розрізав би літери навпіл. Пауза від
 * трьох одиниць — нова літера; це рівно те, що написано в стандарті.
 */
export function thresholdsFor(wpm: number): Thresholds {
  const unit = unitFor(wpm)
  return { dashAt: unit * 2, letterAt: unit * 3, wordAt: unit * 7 }
}

/**
 * Пороги для передавання за зразком — з поправкою на Фарнсворт.
 *
 * Строгі 1 : 3 : 7 тут не годяться, і це не поблажливість. Людина, яка
 * *складає* передачу, мусить пригадати кожен знак, перш ніж його дати, — пауза
 * між літерами в неї виходить у кілька разів довша за нормативну, хоча самі
 * літери відстукані правильно. За порогами від швидкості знаків кожна така
 * пауза зараховувалася б як межа слова, і передача розпадалася б на слова
 * з однієї літери. Тому паузи міряються за **ефективною** швидкістю: рівно те,
 * що обіцяє повзунок, тільки застосоване й до ключа, а не лише до звучання.
 *
 * Межі стоять посередині між сусідніми нормативними тривалостями — посередині
 * в кратному вимірі, бо тривалості морзянки різняться кратно, а не на стільки-то
 * мілісекунд.
 */
export function sendingThresholds(charWpm: number, effectiveWpm: number): Thresholds {
  const gaps = gapsFor(charWpm, Math.min(effectiveWpm, charWpm))
  const between = (a: number, b: number) => Math.sqrt(a * b)

  return {
    dashAt: unitFor(charWpm) * 2,
    letterAt: between(gaps.element, gaps.letter),
    wordAt: between(gaps.letter, gaps.word),
  }
}

export function groupStrokes(strokes: Stroke[], t: Thresholds): Letter[] {
  if (strokes.length === 0) return []

  const letters: Letter[] = []
  let current: Letter = { code: '', strokes: [], wordBreakBefore: false }

  strokes.forEach((stroke, i) => {
    if (i > 0) {
      const word = stroke.gap >= t.wordAt
      if (word || stroke.gap >= t.letterAt) {
        letters.push(current)
        current = { code: '', strokes: [], wordBreakBefore: word }
      }
    }
    current.code += stroke.hold >= t.dashAt ? '-' : '.'
    current.strokes.push(stroke)
  })
  letters.push(current)

  return letters
}

/** Літери рядком: пробіл — межа літери, «/» — межа слова. */
export function morseOf(letters: Letter[]): string {
  return letters
    .filter((l) => l.code.length > 0)
    .map((l, i) => (i > 0 && l.wordBreakBefore ? `/ ${l.code}` : l.code))
    .join(' ')
    .trim()
}

export type KeyReading = { letters: Letter[]; morse: string; thresholds: Thresholds }

export function readStrokes(strokes: Stroke[], wpm: number): KeyReading {
  const thresholds = thresholdsFor(wpm)
  const letters = groupStrokes(strokes, thresholds)
  return { letters, morse: morseOf(letters), thresholds }
}

/**
 * Скільки тиші чекати, перш ніж вважати останню літеру закінченою.
 * Це той самий поріг літери — просто нижче нього чекати немає сенсу.
 */
export function idleFor(t: Thresholds): number {
  return Math.max(250, Math.round(t.letterAt))
}

/* ---------- зворотний звʼязок по стуку ---------- */

export type Keying = {
  /** Медіанна тривалість короткого натискання. 0 — ще не було. */
  dot: number
  /** Медіанна тривалість довгого натискання. */
  dash: number
  /** Медіанна пауза всередині літери. */
  intraGap: number
  /** Медіанна пауза між літерами. */
  letterGap: number
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

/** Скільки одиниць має тривати натискання: крапка чи тире. */
const HOLD_STEPS = [1, 3]
/** І пауза: між знаками, між літерами, між словами. */
const GAP_STEPS = [1, 3, 7]

/**
 * Одиниця, до сітки якої нинішній стук лягає найкраще.
 *
 * Ключове тут — оцінка **не залежить від виставленої швидкості**. Спроба
 * спершу розкласти стук поточними порогами, а потім із цієї розкладки радити
 * швидкість, працює лише коли швидкість уже майже правильна: за хибних порогів
 * пауза всередині літери зараховується до міжлітерних, і порада вказує туди ж,
 * де вже стоїш. Тому тут перебираються всі швидкості діапазону, і для кожної
 * міряється, наскільки далеко тривалості лежать від найближчого дозволеного
 * кратного. Кратний вимір (логарифм) обов'язковий: інакше довгі паузи важили б
 * більше за короткі просто через свій розмір.
 */
function fitUnit(strokes: Stroke[]): number | null {
  const holds = strokes.map((s) => s.hold).filter((h) => h > 0)
  const gaps = strokes
    .slice(1)
    .map((s) => s.gap)
    .filter((g) => g > 0)

  if (holds.length < 3 || gaps.length < 2) return null

  const offGrid = (value: number, unit: number, steps: number[]) =>
    Math.min(...steps.map((n) => Math.abs(Math.log(value / (unit * n)))))

  let best: number | null = null
  let bestCost = Infinity

  for (let wpm = WPM_MIN; wpm <= WPM_MAX; wpm++) {
    const unit = unitFor(wpm)
    let cost = 0
    for (const hold of holds) cost += offGrid(hold, unit, HOLD_STEPS)
    for (const gap of gaps) cost += offGrid(gap, unit, GAP_STEPS)
    if (cost < bestCost) {
      bestCost = cost
      best = unit
    }
  }

  return best
}

/**
 * Як людина стукає насправді — щоб було з чим порівняти цілі.
 *
 * Розкладка робиться за найкращою підгонкою, а не за поточними порогами: інакше
 * невдало виставлена швидкість спотворювала б і самі виміри, і в таблиці
 * зʼявлялися б прочерки саме тоді, коли вони найпотрібніші.
 */
export function measureKeying(strokes: Stroke[]): Keying {
  const empty: Keying = { dot: 0, dash: 0, intraGap: 0, letterGap: 0 }
  const unit = fitUnit(strokes)
  if (unit === null) return empty

  const holds = strokes.map((s) => s.hold).filter((h) => h > 0)
  const gaps = strokes
    .slice(1)
    .map((s) => s.gap)
    .filter((g) => g > 0)

  return {
    dot: median(holds.filter((h) => h < unit * 2)),
    dash: median(holds.filter((h) => h >= unit * 2)),
    intraGap: median(gaps.filter((g) => g < unit * 3)),
    letterGap: median(gaps.filter((g) => g >= unit * 3 && g < unit * 7)),
  }
}

/** Швидкість, за якої нинішній стук ліг би на сітку найточніше. */
export function suggestWpm(strokes: Stroke[]): number | null {
  const unit = fitUnit(strokes)
  return unit === null ? null : Math.round(wpmForUnit(unit))
}
