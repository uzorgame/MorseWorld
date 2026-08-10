/** Ядро приймає числа й віддає числа. Нічого браузерного тут бути не може. */

export type MorseScript = 'latin' | 'cyrillic'

export type MorseTable = {
  id: string
  name: string
  script: MorseScript
  /** 'А' → '.-' */
  chars: Record<string, string>
  prosigns?: Record<string, string>
}

/**
 * Єдине проміжне представлення: Text ↔ Symbols ↔ PlayStep[] ↔ Signal.
 *
 * Сам крок описаний типом `PlayStep` у schedule.ts — там, де його й будують.
 * Тут колись лежав другий тип на те саме (`MorseEvent`), яким ніхто не
 * користувався, зате він фігурував у схемі архітектури на сторінці «Як
 * влаштовано». Схема обіцяла ланку, якої в коді не було.
 */
