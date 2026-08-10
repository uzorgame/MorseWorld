import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import type { MorseTable } from '../core/types'
import { DEFAULT_TABLE_ID, getTable, isSelectable, isTableId, type TableId } from '../core/tables'

type TableContext = {
  tableId: TableId
  table: MorseTable
  setTableId: (id: TableId) => void
}

const Ctx = createContext<TableContext | null>(null)

/**
 * Автовизначення таблиці при декодуванні неможливе: латиниця й кирилиця
 * збігаються за кодами. Тому вибір завжди явний.
 *
 * Між відвідуваннями він **не** зберігається, і це свідомо. Кирилична таблиця —
 * додаткова: уроки Коха й тексти для читання на ній не працюють. Один раз
 * натиснута КИР лишалася назавжди, і сайт відкривався в режимі, де половина
 * функцій відмовляє, — виглядало це так, ніби він сам її вмикає. Тому кожне
 * завантаження починається з міжнародної, а перемкнутися можна й далі: вибір
 * живе, поки живе сеанс, і його ще можна передати через `?table=`.
 */
function initialId(): TableId {
  // Одноразове прибирання: вибір таблиці колись зберігався, і в тих, хто вже
  // заходив, ключ лежить далі. Ніхто його не читає, тому просто чистимо.
  try {
    localStorage.removeItem('morseworld:table')
  } catch {
    /* сховище недоступне — нічого й не лишилося */
  }

  // Непропоновану таблицю не піднімаємо навіть з адреси: інтерфейс працював би
  // на ній, а активної кнопки не було б видно.
  const fromUrl = new URLSearchParams(window.location.search).get('table')
  if (isTableId(fromUrl) && isSelectable(fromUrl)) return fromUrl

  return DEFAULT_TABLE_ID
}

export function TableProvider({ children }: { children: ReactNode }) {
  const [tableId, setId] = useState<TableId>(initialId)

  const setTableId = useCallback((id: TableId) => setId(id), [])

  const value = useMemo<TableContext>(
    () => ({ tableId, table: getTable(tableId), setTableId }),
    [tableId, setTableId],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTable(): TableContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTable має викликатися всередині <TableProvider>')
  return ctx
}
