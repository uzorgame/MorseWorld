import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'uk' | 'en'

const STORAGE_KEY = 'morseworld:lang'
const LANGS: Lang[] = ['en', 'uk']
const FALLBACK: Lang = 'en'

type LangContext = {
  lang: Lang
  setLang: (lang: Lang) => void
}

const Ctx = createContext<LangContext | null>(null)

function isLang(value: string | null): value is Lang {
  return value !== null && (LANGS as string[]).includes(value)
}

/**
 * Мова пристрою. Дивимося на весь список `navigator.languages` по порядку й
 * беремо ту з двох наших, яка трапиться раніше: у `pl-PL, uk` це українська, а
 * в `en-US, uk` — англійська, бо саме її людина поставила вище. Порівнюємо
 * лише первинний субтег, щоб `uk-UA` теж збігався з `uk`.
 */
function fromDevice(): Lang | null {
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of tags) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'uk') return 'uk'
    if (base === 'en') return 'en'
  }
  return null
}

/**
 * Основна мова сайту — англійська. Українську вмикаємо самі лише тоді, коли її
 * заявляє сам пристрій; ручний вибір і `?lang=` завжди мають вищу вагу.
 */
function initial(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (isLang(fromUrl)) return fromUrl
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isLang(stored)) return stored
  return fromDevice() ?? FALLBACK
}

/**
 * Поки перемикач керує лише запуском сайту. Коли інтерфейс буде перекладений
 * повністю, той самий контекст візьме на себе весь текст.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setState] = useState<Lang>(initial)

  const setLang = useCallback((next: Lang) => {
    setState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const value = useMemo<LangContext>(() => ({ lang, setLang }), [lang, setLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang(): LangContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLang має викликатися всередині <LangProvider>')
  return ctx
}
