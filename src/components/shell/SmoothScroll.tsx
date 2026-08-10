import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

import { SCROLL_OFFSET, registerLenis, scrollToSelector } from '../../lib/scroll'

/**
 * Інерційний скрол. Налаштування зняті з uz-or.com — та сама крива й тривалість,
 * щоб відчуття збігалося.
 *
 * prefers-reduced-motion вимикає його повністю: тоді працює нативний скрол
 * браузера, без жодного перехоплення колеса.
 */
export function SmoothScroll() {
  const { pathname, hash } = useLocation()
  const lenis = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      // Lenis сам веде rAF-цикл — власний нам тут не потрібен.
      autoRaf: true,
      // Звичайні якорі теж їдуть плавно, з поправкою на хедер.
      anchors: { offset: SCROLL_OFFSET },
    })

    lenis.current = instance
    registerLenis(instance)

    return () => {
      registerLenis(null)
      instance.destroy()
      lenis.current = null
    }
  }, [])

  useEffect(() => {
    // Перехід із хешем — це прохід до конкретної секції: доїжджаємо плавно.
    if (hash) {
      scrollToSelector(hash)
      return
    }

    // Звичайна зміна маршруту скидає позицію миттєво: інерційний доїзд через
    // усю сторінку виглядав би як баг, а не як перехід.
    if (lenis.current) lenis.current.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
