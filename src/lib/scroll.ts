import type Lenis from 'lenis'

/** Поправка на висоту липкого хедера. Та сама, що в конфігу якорів Lenis. */
export const SCROLL_OFFSET = -84

let instance: Lenis | null = null

/** SmoothScroll реєструє тут свій екземпляр, щоб до нього могли дістатися кнопки. */
export function registerLenis(lenis: Lenis | null) {
  instance = lenis
}

/**
 * Плавний доїзд до секції. Без Lenis (prefers-reduced-motion) — миттєвий стрибок,
 * бо вмикати нативний smooth там, де користувач попросив менше руху, безглуздо.
 */
export function scrollToSelector(selector: string) {
  const el = document.querySelector(selector)
  if (!(el instanceof HTMLElement)) return

  if (instance) instance.scrollTo(el, { offset: SCROLL_OFFSET })
  else el.scrollIntoView({ behavior: 'auto', block: 'start' })
}
