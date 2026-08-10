import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Inline-розмітка для перекладеної прози: `**жирне**`, `` `код` `` і
 * `[текст](/шлях)`.
 *
 * Навмисно мінімальна — рівно те, чим користуються тексти цього сайту.
 * Без неї кожен абзац із виділеним словом довелося б писати JSX-деревом
 * окремо для кожної мови, хоча відрізняється лише сам текст.
 */
const TOKEN = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g

export function rich(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null

  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))

    if (m[1] !== undefined) out.push(<b key={key++}>{m[1]}</b>)
    else if (m[2] !== undefined) out.push(<code key={key++}>{m[2]}</code>)
    else if (m[3] !== undefined) {
      out.push(
        <Link key={key++} to={m[4] ?? '#'} style={{ textDecoration: 'underline' }}>
          {m[3]}
        </Link>,
      )
    }

    last = TOKEN.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))

  return out
}

export function Rich({ text }: { text: string }) {
  return <>{rich(text)}</>
}
