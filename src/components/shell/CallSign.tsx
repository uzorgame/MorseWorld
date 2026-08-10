import type { Lang } from '../../state/lang'
import './shell.css'

/**
 * Надзаголовок сторінки: справжній радіокод морзянкою плюс його розшифровка.
 * Декорація і зміст тут — та сама річ.
 *
 * Це не Q-коди як функція (їх ТЗ виносить за межі v1), а підпис сторінки:
 * жодного довідника чи пошуку по кодах тут немає.
 */
export type Call = { morse: string; label: string }

type Props = Call & { hero?: boolean }

export function CallSign({ morse, label, hero = false }: Props) {
  return (
    <div className="call" data-hero={hero ? '' : undefined}>
      <span className="call__morse mono" aria-hidden="true">
        {morse}
      </span>
      <span className="micro">{label}</span>
    </div>
  )
}

/**
 * Позивні сторінок. Кожен — реальний код, який означає те, що робить сторінка.
 * Сам код морзянкою — інтернаціональний і не перекладається; перекладається
 * лише розшифровка після «·».
 *
 * Це рішення ухвалене порівнянням шести варіантів надзаголовка героя: пульсуюча
 * пігулка «● У ЕФІРІ» з тріадою прикметників, Q-код статусу, приладові
 * показники, шапка документа, проста фраза й повна відсутність надзаголовка.
 * Виграв позивний — єдиний варіант, у якому декорація і зміст є тією самою
 * річчю: `CQ` справді означає «відгукніться всі, хто чує», а не імітує статус.
 * Звідси прийом розійшовся на всі сторінки.
 */
type CallKey =
  | 'home'
  | 'decoder'
  | 'practice'
  | 'learn'
  | 'reading'
  | 'chart'
  | 'about'
  | 'aboutHow'
  | 'aboutSources'
  | 'aboutPrivacy'

const CALLS_UK: Record<CallKey, Call> = {
  /** Загальний виклик: «відгукніться всі, хто чує». */
  home: { morse: '−·−· −−·−', label: 'CQ · ВСІМ, ХТО НА ЧАСТОТІ' },
  /** RX — приймач. */
  decoder: { morse: '·−· −··−', label: 'RX · НА ПРИЙОМІ' },
  /** VVV — класична пробна передача для налаштування. */
  practice: { morse: '···− ···− ···−', label: 'VVV · ПЕРЕВІРКА ПЕРЕДАЧІ' },
  /** QRS — «передавайте повільніше»; те, що першим питає новачок. */
  learn: { morse: '−−·− ·−· ···', label: 'QRS · ПЕРЕДАВАЙТЕ ПОВІЛЬНІШЕ' },
  /** QTC — «маю для вас повідомлення». */
  reading: { morse: '−−·− − −·−·', label: 'QTC · МАЮ ДЛЯ ВАС ТЕКСТИ' },
  /** Абетка як вона є. */
  chart: { morse: '·− −··· −·−·', label: 'ABC · УСІ ЗНАКИ' },
  /** DE — «від»; у ефірі стоїть перед позивним того, хто говорить. */
  about: { morse: '−·· ·', label: 'DE · ВІД КОГО ЦЕЙ СИГНАЛ' },
  /** QRK — «яка розбірливість мого сигналу»; сторінка саме про сигнал і його вигляд. */
  aboutHow: { morse: '−−·− ·−· −·−', label: 'QRK · ЯК ІДЕ СИГНАЛ' },
  /** QSL — підтвердження прийому; QSL-картка це документальне свідчення звʼязку. */
  aboutSources: { morse: '−−·− ··· ·−··', label: 'QSL · ЧИМ ПІДТВЕРДЖЕНО' },
  /** QRT — «припиняю передачу». Тут її й немає: жодного запиту в мережу. */
  aboutPrivacy: { morse: '−−·− ·−· −', label: 'QRT · НІЧОГО НЕ ПЕРЕДАЄТЬСЯ' },
}

const CALLS_EN: Record<CallKey, Call> = {
  home: { morse: '−·−· −−·−', label: 'CQ · CALLING ALL STATIONS' },
  decoder: { morse: '·−· −··−', label: 'RX · RECEIVING' },
  practice: { morse: '···− ···− ···−', label: 'VVV · TRANSMISSION TEST' },
  learn: { morse: '−−·− ·−· ···', label: 'QRS · SEND MORE SLOWLY' },
  reading: { morse: '−−·− − −·−·', label: 'QTC · I HAVE A MESSAGE FOR YOU' },
  chart: { morse: '·− −··· −·−·', label: 'ABC · EVERY SIGN' },
  about: { morse: '−·· ·', label: 'DE · FROM' },
  aboutHow: { morse: '−−·− ·−· −·−', label: 'QRK · HOW READABLE IS THE SIGNAL' },
  aboutSources: { morse: '−−·− ··· ·−··', label: 'QSL · WHAT CONFIRMS IT' },
  aboutPrivacy: { morse: '−−·− ·−· −', label: 'QRT · NOTHING IS TRANSMITTED' },
}

export function callsFor(lang: Lang): Record<CallKey, Call> {
  return lang === 'en' ? CALLS_EN : CALLS_UK
}
