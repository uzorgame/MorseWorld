/**
 * Метод Коха.
 *
 * Суть методу — у тому, чого він **не** робить: швидкість символів повна з
 * першого уроку й далі не змінюється. Нарощується тільки кількість літер.
 * Якщо вчитися на сповільнених знаках, мозок звикає рахувати крапки, а потім
 * цю звичку доводиться ламати; на повній швидкості знак чується як одне ціле
 * від самого початку. Розтягуються при потребі лише паузи між літерами —
 * це Фарнсворт, він живе в timing.ts.
 *
 * Порядок літер не алфавітний і не випадковий: сусідні знаки навмисно
 * контрастні на слух, а частотні літери йдуть раніше. Саме тому його не можна
 * механічно перекласти на іншу абетку — вийде послідовність, яка плутає.
 * Для кирилиці такого опрацьованого порядку тут немає, і уроки на ній
 * не пропонуються (див. SOURCES.md).
 */

/** Стандартний порядок Коха. Визначений лише для латиниці. */
export const KOCH_ORDER = 'KMRSUAPTLOWI.NJEF0Y,VG5/Q9ZH38B?427C1D6X'

/** Перший урок дає одразу дві літери — розрізняти можна тільки одне з іншим. */
const FIRST_LESSON_CHARS = 2

/** Скільки всього уроків: кожен наступний додає одну літеру. */
export const MAX_LEVEL = KOCH_ORDER.length - FIRST_LESSON_CHARS + 1

export function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(1, Math.round(level)))
}

/** Літери, які звучать на цьому уроці. */
export function alphabetFor(level: number): string {
  return KOCH_ORDER.slice(0, clampLevel(level) + FIRST_LESSON_CHARS - 1)
}

/** Літера, яку саме цей урок додає. На першому уроці нової немає — там одразу дві. */
export function newcomerFor(level: number): string {
  const alphabet = alphabetFor(level)
  return clampLevel(level) === 1 ? '' : (alphabet[alphabet.length - 1] ?? '')
}

/** Скільки разів літеру чули й скільки разів упізнали. */
export type CharStat = { seen: number; hit: number }

/**
 * Наскільки часто підсовувати літеру.
 *
 * Три доданки, і кожен потрібен:
 * — база, щоб жодна літера уроку не зникала з обігу зовсім;
 * — промах, щоб те, що не впізнається, траплялося частіше (звідси й користь
 *   від статистики по літерах — вона не для звіту, а для добору);
 * — новизна, бо щойно додана літера має звучати частіше за вже засвоєні,
 *   інакше урок нічим не відрізняється від попереднього.
 */
const BASE_WEIGHT = 1
const MISS_WEIGHT = 4
const NEW_WEIGHT = 2.5
/** Доки літеру почули менше цього разів, вважаємо статистику ненадійною. */
const TRUST_AFTER = 4

export function weightFor(char: string, level: number, stat: CharStat | undefined): number {
  let weight = BASE_WEIGHT
  if (char === newcomerFor(level)) weight += NEW_WEIGHT

  if (stat && stat.seen >= TRUST_AFTER) {
    weight += MISS_WEIGHT * (1 - stat.hit / stat.seen)
  } else {
    // Незнайому літеру теж треба показувати частіше — інакше вона ніколи
    // не набере статистики, за якою її можна було б підняти.
    weight += MISS_WEIGHT / 2
  }

  return weight
}

/** Випадковий вибір із вагами. `rand` — щоб добір можна було перевірити тестом. */
function pickWeighted(chars: string[], weights: number[], rand: () => number): string {
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0) return chars[0] ?? ''

  let point = rand() * total
  for (let i = 0; i < chars.length; i++) {
    point -= weights[i] ?? 0
    if (point <= 0) return chars[i] ?? ''
  }
  return chars[chars.length - 1] ?? ''
}

export type DrillOptions = {
  level: number
  /** Скільки груп у завданні. */
  groups: number
  /** Скільки символів у групі. */
  groupSize: number
  stats: Record<string, CharStat>
  rand?: () => number
}

/**
 * Завдання уроку: групи символів, розділені пробілами.
 *
 * Групами, а не суцільним рядком, бо на слух так і передають, і бо в разі
 * помилки видно, де саме людина збилася.
 */
export function makeDrill(options: DrillOptions): string {
  const { level, groups, groupSize, stats, rand = Math.random } = options
  const chars = [...alphabetFor(level)]
  if (chars.length === 0) return ''

  const weights = chars.map((ch) => weightFor(ch, level, stats[ch]))

  return Array.from({ length: Math.max(1, groups) }, () =>
    Array.from({ length: Math.max(1, groupSize) }, () => pickWeighted(chars, weights, rand)).join(
      '',
    ),
  ).join(' ')
}
