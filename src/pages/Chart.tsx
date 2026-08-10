import { useMemo, useState } from 'react'

import { callsFor } from '../components/shell/CallSign'
import { TableSwitch } from '../components/shell/TableSwitch'
import { tableMeta } from '../core/tables'
import { counted, countedEn } from '../lib/plural'
import { useLang } from '../state/lang'
import { useTable } from '../state/table'
import { PageHead } from './PageHead'
import './pages.css'

const STRINGS = {
  uk: {
    title: 'Таблиця символів',
    lead: 'Усі знаки з їхніми кодами. Майте на увазі: той самий код може означати різні літери — «·−» це і латинська A, і кирилична А. Тому спершу виберіть абетку, а вже потім шукайте символ або код.',
    placeholder: 'Пошук: літера або код…',
    ariaSearch: 'Пошук у таблиці',
    alphabet: 'АБЕТКА',
    count: (n: number) => counted(n, 'СИМВОЛ', 'СИМВОЛИ', 'СИМВОЛІВ'),
  },
  en: {
    title: 'Character chart',
    lead: 'Every sign with its code. Keep in mind: the same code can mean different letters — "·−" is both the Latin A and the Cyrillic А. So pick the alphabet first, then search for a symbol or a code.',
    placeholder: 'Search: letter or code…',
    ariaSearch: 'Search the chart',
    alphabet: 'ALPHABET',
    count: (n: number) => countedEn(n, 'SYMBOL', 'SYMBOLS'),
  },
} as const

export function Chart() {
  const { table, tableId } = useTable()
  const { lang } = useLang()
  const t = STRINGS[lang]
  const [q, setQ] = useState('')

  const entries = useMemo(() => {
    const all = Object.entries(table.chars)
    const query = q.trim().toLowerCase().replace(/·/g, '.').replace(/[−–—]/g, '-')
    if (!query) return all

    // Код шукаємо **з початку**, а не підрядком. Підрядком одне «−» знаходило
    // майже половину таблиці, а «·−» — 35 символів замість очікуваної A:
    // пошук нічого не відсіював і тому нічим не допомагав.
    return all.filter(([ch, code]) => ch.toLowerCase().includes(query) || code.startsWith(query))
  }, [q, table])

  return (
    <div className="page shell">
      <PageHead
        call={callsFor(lang).chart}
        title={t.title}
        lead={t.lead}
        aside={
          <div className="chart-controls">
            <input
              className="chart-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.ariaSearch}
            />
            <TableSwitch />
          </div>
        }
      />

      <div className="section__head">
        <span className="micro">{t.count(entries.length)}</span>
        <span className="micro">
          {t.alphabet}: {tableMeta(tableId, lang).name}
        </span>
      </div>

      <div className="chart-grid">
        {entries.map(([ch, code]) => (
          <div className="chart-cell" key={ch}>
            <b>{ch}</b>
            <code>{code.replace(/\./g, '·').replace(/-/g, '−')}</code>
          </div>
        ))}
      </div>
    </div>
  )
}
