import { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import { audio } from './audio/MorseAudio'
import { BootSequence } from './components/boot/BootSequence'
import { SiteHeader } from './components/shell/SiteHeader'
import { SmoothScroll } from './components/shell/SmoothScroll'
import { SignalBar } from './components/shell/SignalBar'
import { SiteFooter } from './components/shell/SiteFooter'
import { useLang } from './state/lang'

import { Home } from './pages/Home'
import { Decoder } from './pages/Decoder'
import { Practice } from './pages/Practice'
import { Learn } from './pages/Learn'
import { Reading } from './pages/Reading'
import { Chart } from './pages/Chart'
import { About } from './pages/About'
import { AboutHow } from './pages/AboutHow'
import { AboutSources } from './pages/AboutSources'
import { AboutPrivacy } from './pages/AboutPrivacy'
import { NotFound } from './pages/NotFound'

const BOOT_KEY = 'morseworld:booted'

function shouldBoot(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('boot') === '1') return true
  if (params.get('boot') === '0') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return sessionStorage.getItem(BOOT_KEY) !== '1'
}

/**
 * Ховаємо сайт ще до першого малювання, а не в ефекті: ефект спрацював би вже
 * після кадру, і головний екран встиг би блимнути з-під запуску.
 */
function hideSite(hidden: boolean) {
  if (hidden) document.documentElement.dataset.booting = '1'
  else delete document.documentElement.dataset.booting
}

const BOOTS_ON_LOAD = shouldBoot()
hideSite(BOOTS_ON_LOAD)

const TITLE = {
  uk: 'MorseWorld — переклад, тренування, навчання',
  en: 'MorseWorld — translate, practise, learn',
} as const

const DESCRIPTION = {
  uk: 'Клієнтський інструмент для роботи з азбукою Морзе: кодування, декодування зі звуку, ручна практика й навчання за методом Коха.',
  en: 'A client-side tool for working with Morse code: encoding, decoding from audio, hands-on practice and learning by the Koch method.',
} as const

const SKIP_LINK = { uk: 'До основного вмісту', en: 'Skip to main content' } as const

export function App() {
  const [booting, setBooting] = useState(BOOTS_ON_LOAD)
  const { lang } = useLang()

  // <html lang>, заголовок вкладки й опис мають відповідати вибраній мові, а не
  // лишатися застиглими на тому, що прописано в index.html при першому запиті.
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = TITLE[lang]
    document.querySelector('meta[name="description"]')?.setAttribute('content', DESCRIPTION[lang])
  }, [lang])

  const finishBoot = useCallback(() => {
    sessionStorage.setItem(BOOT_KEY, '1')
    hideSite(false)
    setBooting(false)
  }, [])

  /** Сайт відкривається рівно тоді, коли тест-карта починає їхати вгору. */
  const revealSite = useCallback(() => hideSite(false), [])

  /**
   * Відкриваємо звук на будь-яку дію користувача — і пробуємо доти, доки не
   * вийде. Одноразовий слухач тут не годиться: перший жест може трапитися в
   * момент, коли браузер ще не готовий, і другого шансу вже не буде.
   * Щойно контекст заграв, слухачі знімаються самі.
   */
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

    const off = () => events.forEach((e) => window.removeEventListener(e, arm, true))
    function arm() {
      void audio.unlock().then((ok) => {
        if (ok) off()
      })
    }

    events.forEach((e) => window.addEventListener(e, arm, { capture: true, passive: true }))
    return off
  }, [])

  const replayBoot = useCallback(() => {
    hideSite(true)
    setBooting(true)
  }, [])

  return (
    <>
      <SmoothScroll />

      {booting && <BootSequence onFinish={finishBoot} onReveal={revealSite} />}

      <a className="skip-link" href="#main">
        {SKIP_LINK[lang]}
      </a>

      <SiteHeader />

      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/decoder" element={<Decoder />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/reading" element={<Reading />} />
          <Route path="/chart" element={<Chart />} />
          <Route path="/about" element={<About />} />
          <Route path="/about/how" element={<AboutHow />} />
          <Route path="/about/sources" element={<AboutSources />} />
          <Route path="/about/privacy" element={<AboutPrivacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <SiteFooter />
      <SignalBar onReplayBoot={replayBoot} />
    </>
  )
}
