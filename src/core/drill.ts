/**
 * Звірка того, що вийшло, з тим, що мало вийти.
 *
 * Позиційне порівняння тут не годиться: якщо пропустити один символ, усі
 * наступні зсунуться, і тренажер зарахує помилку кожному з них. Тому спершу
 * вирівнювання (відстань Левенштейна з відновленням шляху), і лише потім
 * порівняння. Статистика по літерах тримається саме на цьому: інакше вона
 * звинувачувала б літери, які людина насправді взяла правильно.
 *
 * Вирівнюємо і символи (приймання: почув — вписав), і коди літер
 * (передавання: попросили літеру — відстукав ритм). Алгоритм той самий, тому
 * він тут один і працює на будь-якій послідовності.
 */

export type Pair<T> = {
  /** Що мало бути. null — зайве, чого не просили. */
  want: T | null
  /** Що вийшло. null — пропущено. */
  got: T | null
  ok: boolean
}

export function alignBy<T>(want: T[], got: T[], same: (a: T, b: T) => boolean): Pair<T>[] {
  const n = want.length
  const m = got.length

  // dist[i][j] — скільки правок треба, щоб звести перші i елементів до перших j.
  const dist: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = 0; i <= n; i++) (dist[i] as number[])[0] = i
  for (let j = 0; j <= m; j++) (dist[0] as number[])[j] = j

  const matches = (i: number, j: number) => {
    const a = want[i - 1]
    const b = got[j - 1]
    return a !== undefined && b !== undefined && same(a, b)
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const swap = (dist[i - 1]?.[j - 1] ?? 0) + (matches(i, j) ? 0 : 1)
      const drop = (dist[i - 1]?.[j] ?? 0) + 1
      const add = (dist[i]?.[j - 1] ?? 0) + 1
      ;(dist[i] as number[])[j] = Math.min(swap, drop, add)
    }
  }

  const pairs: Pair<T>[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    const here = dist[i]?.[j] ?? 0
    const a = want[i - 1] ?? null
    const b = got[j - 1] ?? null

    if (i > 0 && j > 0 && here === (dist[i - 1]?.[j - 1] ?? 0) + (matches(i, j) ? 0 : 1)) {
      pairs.push({ want: a, got: b, ok: matches(i, j) })
      i--
      j--
    } else if (i > 0 && here === (dist[i - 1]?.[j] ?? 0) + 1) {
      pairs.push({ want: a, got: null, ok: false })
      i--
    } else {
      pairs.push({ want: null, got: b, ok: false })
      j--
    }
  }

  return pairs.reverse()
}

/* ---------- приймання: почув — вписав ---------- */

export type Cell = {
  /** Що прозвучало. Порожньо — людина вписала лишнє. */
  target: string
  /** Що вписали. Порожньо — символ пропустили. */
  typed: string
  ok: boolean
}

export function align(target: string, typed: string): Cell[] {
  return alignBy([...target], [...typed], (a, b) => a === b).map((pair) => ({
    target: pair.want ?? '',
    typed: pair.got ?? '',
    ok: pair.ok,
  }))
}

export type Score = {
  /** Скільки символів мало бути. */
  total: number
  /** Скільки з них зійшлося. */
  hit: number
  /** Частка правильних, 0…1. */
  rate: number
  cells: Cell[]
}

export function scoreOf(target: string, typed: string): Score {
  const cells = align(target, typed)
  const wanted = cells.filter((c) => c.target !== '')
  const hit = wanted.filter((c) => c.ok).length
  return {
    total: wanted.length,
    hit,
    rate: wanted.length > 0 ? hit / wanted.length : 0,
    cells,
  }
}

/* ---------- передавання: попросили літеру — відстукав ритм ---------- */

/** Літера разом зі своїм кодом: порівнювати треба коди, а показувати літери. */
export type Sign = { char: string; code: string }

export type SendCell = {
  /** Що просили передати. null — відстукано зайве. */
  want: Sign | null
  /** Що вийшло: код і літера, яку він дає. null — літеру пропустили. */
  got: Sign | null
  ok: boolean
}

export type SendScore = {
  total: number
  hit: number
  rate: number
  cells: SendCell[]
}

/**
 * Звірка передачі.
 *
 * Порівнюються **коди**, а не літери, які з них вийшли: якщо людина відстукала
 * ритм, якого в таблиці немає, порівнювати за розшифровкою було б нічого —
 * усі невідомі коди зійшлися б між собою в один UNKNOWN і виглядали б як та
 * сама помилка. Код же показує, що саме пішло не так.
 */
export function scoreSending(want: Sign[], got: Sign[]): SendScore {
  const cells = alignBy(want, got, (a, b) => a.code === b.code)
  const wanted = cells.filter((c) => c.want !== null)
  const hit = wanted.filter((c) => c.ok).length
  return {
    total: wanted.length,
    hit,
    rate: wanted.length > 0 ? hit / wanted.length : 0,
    cells,
  }
}
