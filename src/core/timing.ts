/** Тайминг морзянки. Чисті числа — жодного браузера. */

/** Тривалість крапки в мілісекундах. Базова одиниця, від якої залежить усе інше. */
export function dotMs(wpm: number): number {
  return 1200 / wpm
}

export type Gaps = {
  /** Пауза між елементами всередині літери. */
  element: number
  /** Пауза між літерами. */
  letter: number
  /** Пауза між словами. */
  word: number
}

/**
 * Фарнсворт: символи звучать на швидкості character, а розтягуються лише
 * паузи між літерами й словами — до ефективної швидкості effective.
 * Формула ARRL; при effective ≥ character дає звичайні 3 та 7 одиниць.
 */
export function gapsFor(character: number, effective = character): Gaps {
  const unit = dotMs(character)
  if (effective >= character) {
    return { element: unit, letter: unit * 3, word: unit * 7 }
  }

  // ta — секунди затримки на слово, які треба розподілити між паузами
  const ta = (60 * character - 37.2 * effective) / (character * effective)
  return {
    element: unit,
    letter: ((3 * ta) / 19) * 1000,
    word: ((7 * ta) / 19) * 1000,
  }
}
