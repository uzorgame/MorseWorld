import { SELECTABLE_TABLE_IDS, tableMeta } from '../../core/tables'
import { useLang } from '../../state/lang'
import { useTable } from '../../state/table'
import './shell.css'

type Props = {
  compact?: boolean
}

const LABEL = { uk: 'ТАБЛИЦЯ', en: 'TABLE' } as const
const ARIA = { uk: 'Кодова таблиця', en: 'Code table' } as const

/**
 * Перемикач кодової таблиці. Міжнародна — основна й стоїть за замовчуванням,
 * кириличні додаються поруч. Вибір завжди явний: підказати його автоматично
 * не можна, бо коди латиниці й кирилиці збігаються.
 */
export function TableSwitch({ compact = false }: Props) {
  const { tableId, setTableId } = useTable()
  const { lang } = useLang()
  const ids = SELECTABLE_TABLE_IDS

  return (
    <div className="tsw" role="group" aria-label={ARIA[lang]}>
      {!compact && <span className="micro tsw__label">{LABEL[lang]}</span>}
      <div className="tsw__set">
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            className="tsw__opt micro"
            data-active={id === tableId ? '' : undefined}
            aria-pressed={id === tableId}
            title={`${tableMeta(id, lang).name} — ${tableMeta(id, lang).hint}`}
            onClick={() => setTableId(id)}
          >
            {tableMeta(id, lang).short}
          </button>
        ))}
      </div>
    </div>
  )
}
