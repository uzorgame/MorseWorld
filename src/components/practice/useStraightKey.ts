import { useCallback, useEffect, useRef, useState } from 'react'

import type { Stroke } from '../../core/keyDecoder'
import { audio } from '../../audio/MorseAudio'

/**
 * Ручний ключ. Хук нічого не вирішує про крапки й тире — він лише міряє,
 * скільки тривало натискання і скільки тиші було перед ним. Розбір на знаки
 * й літери робить декодер, бо йому видно всю послідовність, а не одну подію.
 *
 * Коли передача вважається закінченою, хук теж не вирішує: це питання сторінки,
 * а не ключа. Звідси й `pressed` — по ньому видно, чи рука ще на ключі.
 *
 * Час беремо з `timeStamp` події, а не з моменту, коли до неї дійшли руки.
 * Різниця буває велика: перше натискання на сторінці будує AudioContext, і це
 * блокує потік на десятки мілісекунд — відпускання встигає статися, але
 * обробляється пізніше. За `performance.now()` коротка крапка тоді виходила б
 * тире. `timeStamp` живе в тій самій шкалі й показує, коли подія сталася
 * насправді, тому будь-який фриз потоку більше не псує замір.
 */

export type KeyOptions = {
  freq: number
  volume: number
  /** Ловити клавіатуру. Площадка мишею працює завжди. */
  enabled: boolean
  onStroke: (stroke: Stroke) => void
}

export function useStraightKey(options: KeyOptions) {
  const [pressed, setPressed] = useState(false)

  const downAt = useRef(0)
  const releasedAt = useRef(0)

  // Свіжі налаштування тримаємо в ref, щоб слухачі клавіатури не перевішувалися
  // на кожну зміну гучності.
  const opts = useRef(options)
  opts.current = options

  /**
   * Зняти фокус із того, що під ним випадково опинилося.
   *
   * Пробіл і Enter — це водночас клавіші активації, тому браузер малює на
   * елементі в фокусі рамку `:focus-visible`. Людина стукає ключем, а обвідка
   * зʼявляється на посиланні в меню, яким вона сюди прийшла, — і виглядає це
   * як помилка. Сам ключ не чіпаємо: якщо на нього перейшли табом, фокус має
   * там і лишитися, інакше клавіатурна навігація зламається.
   */
  const dropStrayFocus = () => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return
    if (active.dataset.keyPad !== undefined) return
    if (active.matches('input, textarea, select')) return
    active.blur()
  }

  const press = useCallback((at?: number) => {
    if (downAt.current) return

    downAt.current = at ?? performance.now()
    setPressed(true)

    // Тон піднімаємо синхронно: між клавішею і звуком має бути мінімум.
    audio.keyDown(opts.current.freq, opts.current.volume || 0.25)
    if (!audio.running) void audio.unlock()
  }, [])

  const release = useCallback((at?: number) => {
    if (!downAt.current) return
    const now = at ?? performance.now()
    const hold = Math.max(0, now - downAt.current)
    const gap = releasedAt.current ? Math.max(0, downAt.current - releasedAt.current) : 0

    downAt.current = 0
    releasedAt.current = now
    setPressed(false)
    audio.keyUp()

    opts.current.onStroke({ hold, gap })
  }, [])

  /** Забути про паузу, що йде: після очищення чи видалення її не має бути. */
  const reset = useCallback(() => {
    releasedAt.current = 0
  }, [])

  useEffect(() => {
    if (!options.enabled) return

    const isKey = (e: KeyboardEvent) => e.code === 'Space' || e.key === 'Enter'
    const down = (e: KeyboardEvent) => {
      if (!isKey(e)) return
      if (e.repeat) return // автоповтор ОС — це не передача
      e.preventDefault() // інакше пробіл скролить сторінку
      dropStrayFocus()
      press(e.timeStamp)
    }
    const up = (e: KeyboardEvent) => {
      if (!isKey(e)) return
      e.preventDefault()
      release(e.timeStamp)
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [options.enabled, press, release])

  useEffect(() => () => audio.keyUp(), [])

  return { pressed, press, release, reset }
}
