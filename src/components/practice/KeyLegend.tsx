import type { Thresholds } from '../../core/keyDecoder'
import { useLang } from '../../state/lang'
import './keyLegend.css'

/**
 * Пам'ятка до ручного ключа.
 *
 * Пороги рахуються з обраної швидкості й показані тут у мілісекундах — саме
 * для того, щоб було до чого підлаштовуватися. Поки вони вимірювалися зі стуку,
 * ці числа повзли від знака до знака, і памʼятка нічого не памʼятала.
 */

type Props = { thresholds: Thresholds }

const TITLES = {
  uk: { dot: 'крапка', dash: 'тире', gap: 'нова літера', word: 'межа слова «/»' },
  en: { dot: 'dot', dash: 'dash', gap: 'new letter', word: 'word break "/"' },
} as const

const HINT = {
  uk: {
    shorter: (ms: string) => `коротше за ${ms}`,
    longer: (ms: string) => `довше за ${ms}`,
    gapFrom: (ms: string) => `пауза від ${ms}`,
  },
  en: {
    shorter: (ms: string) => `shorter than ${ms}`,
    longer: (ms: string) => `longer than ${ms}`,
    gapFrom: (ms: string) => `gap from ${ms}`,
  },
} as const

export function KeyLegend({ thresholds }: Props) {
  const { lang } = useLang()
  const title = TITLES[lang]
  const hint = HINT[lang]
  const ms = (value: number) => `${Math.round(value)} ${lang === 'en' ? 'ms' : 'мс'}`

  const items = [
    { sign: 'dot', title: title.dot, hint: hint.shorter(ms(thresholds.dashAt)) },
    { sign: 'dash', title: title.dash, hint: hint.longer(ms(thresholds.dashAt)) },
    { sign: 'gap', title: title.gap, hint: hint.gapFrom(ms(thresholds.letterAt)) },
    { sign: 'word', title: title.word, hint: hint.gapFrom(ms(thresholds.wordAt)) },
  ] as const

  return (
    <dl className="klg">
      {items.map((item) => (
        <div className="klg__item" key={item.sign}>
          <dt className={`klg__sign klg__sign--${item.sign}`} aria-hidden="true">
            {item.sign === 'word' ? '/' : null}
          </dt>
          <dd>
            <b>{item.title}</b>
            <span>{item.hint}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
