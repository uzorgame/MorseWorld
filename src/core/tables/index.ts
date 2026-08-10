import type { MorseTable } from '../types'
import { international } from './international'
import { cyrillic, cyrillicUa } from './cyrillic'

export type TableId = 'international' | 'cyrillic' | 'cyrillic-ua'

export const DEFAULT_TABLE_ID: TableId = 'international'

/** Порядок тут визначає порядок у перемикачі. Міжнародна — перша й головна. */
export const TABLES: Record<TableId, MorseTable> = {
  international,
  cyrillic,
  'cyrillic-ua': cyrillicUa,
}

export const TABLE_IDS = Object.keys(TABLES) as TableId[]

/**
 * Таблиці, які є в коді, але поки не пропонуються користувачу.
 * Українська лишається тут, доки її коди не звірені з першоджерелом:
 * інструмент, який обіцяє точність, не має підсовувати неперевірене.
 * Документація по ній — у SOURCES.md. На сторінці джерел її свідомо немає:
 * там перелічено тільки те, що справді працює.
 */
export const UNVERIFIED_TABLE_IDS: TableId[] = ['cyrillic-ua']

/** Те, з чого справді можна вибирати в інтерфейсі. */
export const SELECTABLE_TABLE_IDS = TABLE_IDS.filter((id) => !UNVERIFIED_TABLE_IDS.includes(id))

export function isSelectable(id: TableId): boolean {
  return !UNVERIFIED_TABLE_IDS.includes(id)
}

/**
 * Підписи для перемикача й показу активної таблиці — до ядра не належать,
 * це суто UI, і тому мовозалежні. `Lang` тут не імпортується зі `state/lang`
 * навмисно: типи структурно однакові, а ядро не має залежати від стану.
 */
export type TableMeta = { short: string; hint: string; name: string }

const TABLE_META_UK: Record<TableId, TableMeta> = {
  international: {
    short: 'ITU',
    hint: 'Латиниця, ITU-R M.1677-1',
    name: 'International (ITU-R M.1677-1)',
  },
  cyrillic: {
    short: 'КИР',
    hint: 'Кирилична база: рос / укр / болг',
    name: 'Кирилична (базова)',
  },
  'cyrillic-ua': { short: 'УКР', hint: 'Українська: І, Ї, Є, Ґ', name: 'Українська' },
}

const TABLE_META_EN: Record<TableId, TableMeta> = {
  international: {
    short: 'ITU',
    hint: 'Latin letters, ITU-R M.1677-1',
    name: 'International (ITU-R M.1677-1)',
  },
  cyrillic: {
    short: 'CYR',
    hint: 'Base Cyrillic: RU / UA / BG',
    name: 'Cyrillic (base)',
  },
  'cyrillic-ua': { short: 'UA', hint: 'Ukrainian: І, Ї, Є, Ґ', name: 'Ukrainian' },
}

export function tableMeta(id: TableId, lang: 'uk' | 'en'): TableMeta {
  return (lang === 'en' ? TABLE_META_EN : TABLE_META_UK)[id]
}

export function isTableId(value: string | null): value is TableId {
  return value !== null && value in TABLES
}

export function getTable(id: TableId): MorseTable {
  return TABLES[id]
}

export { international, cyrillic, cyrillicUa }
