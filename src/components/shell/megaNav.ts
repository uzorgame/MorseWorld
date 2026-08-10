/** Вміст випадних панелей. Тримаємо окремо від розмітки, щоб редагувати текст, а не JSX. */

import type { TableId } from '../../core/tables'
import type { TranslatorIntent } from '../../lib/translatorIntent'
import type { Lang } from '../../state/lang'

export type MegaLink = {
  to: string
  code: string
  title: string
  body: string
  soon?: boolean
  /** Пункт не просто веде на сторінку, а вмикає в перекладачі потрібний режим. */
  intent?: TranslatorIntent
  /** Пункт заразом обирає кодову таблицю. */
  table?: TableId
}

export type MegaMenu = {
  /** Підпис колонки посилань. */
  label: string
  links: MegaLink[]
  /** Права колонка: коротка довідка, а не ще один список посилань. */
  note: { label: string; title: string; body: string }
}

export type NavEntry = {
  to: string
  label: string
  menu: MegaMenu
}

const NAV_UK: NavEntry[] = [
  {
    to: '/',
    label: 'Перекладач',
    menu: {
      label: 'ЩО МОЖНА ЗРОБИТИ',
      links: [
        {
          to: '/#translator',
          code: '·−',
          title: 'Текст у морзе',
          body: 'Пишете звичайно — код зʼявляється й звучить на кожне натискання.',
          intent: 'encode',
        },
        {
          to: '/#translator',
          code: '−·',
          title: 'Морзе в текст',
          body: 'Вставляєте крапки й тире або відстукуєте їх самі — отримуєте літери.',
          intent: 'decode',
        },
      ],
      note: {
        label: 'АБЕТКА',
        title: 'Спершу виберіть таблицю',
        body: 'Латиниця й кирилиця мають спільні коди, тому вгадати абетку автоматично неможливо. Перемикач стоїть над полем вводу.',
      },
    },
  },
  {
    to: '/decoder',
    label: 'Декодер',
    menu: {
      label: 'ЗВІДКИ БРАТИ СИГНАЛ',
      links: [
        {
          to: '/#translator',
          code: '−·−',
          title: 'Почути код',
          body: 'Програвання синусом 600 Гц із точним таймингом — і підсвічуванням за звуком.',
          intent: 'play',
        },
        {
          to: '/decoder',
          code: '···',
          title: 'З мікрофона',
          body: 'Підносите телефон до динаміка — текст зʼявляється наживо.',
          soon: true,
        },
        {
          to: '/decoder',
          code: '··−·',
          title: 'З аудіофайлу',
          body: 'WAV, MP3, OGG або M4A до 20 МБ. Обробка просто у вкладці.',
          soon: true,
        },
      ],
      note: {
        label: 'ПРИВАТНІСТЬ',
        title: 'Звук нікуди не йде',
        body: 'Ні запис із мікрофона, ні файл не залишають ваш пристрій — надсилати їх просто нікуди, сервера немає.',
      },
    },
  },
  {
    to: '/practice',
    label: 'Пісочниця',
    menu: {
      label: 'ЯК ПЕРЕДАВАТИ',
      links: [
        {
          to: '/practice',
          code: '−',
          title: 'Ручний ключ',
          body: 'Пробіл, Enter, миша або палець. Швидкість задаєте ви, пороги видно в мілісекундах.',
        },
        {
          to: '/practice',
          code: '−·−−',
          title: 'Режим iambic',
          body: 'Дві клавіші: одна сипле крапки, друга — тире.',
          soon: true,
        },
      ],
      note: {
        label: 'ЗВОРОТНИЙ ЗВʼЯЗОК',
        title: 'Видно, як вас чують',
        body: 'Поки ви стукаєте, поруч біжить стрічка елементів і те, що з них прочитав декодер. Помилку видно одразу, а не наприкінці.',
      },
    },
  },
  {
    to: '/learn',
    label: 'Навчання',
    menu: {
      label: 'З ЧОГО ПОЧАТИ',
      links: [
        {
          to: '/learn',
          code: '−·−·',
          title: 'Метод Коха',
          body: 'Дві літери на першому уроці, далі по одній. Швидкість повна з самого початку.',
        },
        {
          to: '/learn/reading',
          code: '·−·',
          title: 'Читання текстів',
          body: 'Справжні книжки замість випадкових літер. Тільки суспільне надбання.',
        },
      ],
      note: {
        label: 'ЧОМУ САМЕ ТАК',
        title: 'Швидкість не нарощують',
        body: 'Якщо вчитися повільно, мозок звикає рахувати крапки — і потім доводиться переучуватися. Тому темп одразу дорослий, а росте лише кількість літер.',
      },
    },
  },
  {
    to: '/chart',
    label: 'Таблиця',
    menu: {
      label: 'АБЕТКИ',
      links: [
        {
          to: '/chart',
          code: '·−',
          title: 'International',
          body: 'ITU-R M.1677-1: латиниця, цифри, розділові знаки.',
          table: 'international',
        },
        {
          to: '/chart',
          code: '−···',
          title: 'Кирилична',
          body: 'Спільна частина для української, російської та болгарської.',
          table: 'cyrillic',
        },
      ],
      note: {
        label: 'ПОШУК',
        title: 'Шукає в обидва боки',
        body: 'Можна ввести літеру й побачити код, а можна ввести крапки з тире й знайти літеру.',
      },
    },
  },
  {
    to: '/about',
    label: 'Про проєкт',
    menu: {
      label: 'ЩО ТУТ Є',
      links: [
        {
          to: '/about/how',
          code: '−··',
          title: 'Як влаштовано',
          body: 'Одне представлення сигналу, до якого зводяться всі джерела.',
        },
        {
          to: '/about/sources',
          code: '···−',
          title: 'Джерела таблиць',
          body: 'Звідки взято кожен код і що ще потребує звірки.',
        },
        {
          to: '/about/privacy',
          code: '·−·−',
          title: 'Приватність',
          body: 'Чому нуль мережевих запитів — це властивість, а не обіцянка.',
        },
      ],
      note: {
        label: 'СТАН',
        title: 'Ще в роботі',
        body: 'Працюють перекладач і таблиця. Звук, ручний ключ, декодер і навчання — наступні етапи.',
      },
    },
  },
]

const NAV_EN: NavEntry[] = [
  {
    to: '/',
    label: 'Translator',
    menu: {
      label: 'WHAT YOU CAN DO',
      links: [
        {
          to: '/#translator',
          code: '·−',
          title: 'Text to Morse',
          body: 'Type normally — the code appears and sounds on every keystroke.',
          intent: 'encode',
        },
        {
          to: '/#translator',
          code: '−·',
          title: 'Morse to text',
          body: 'Paste dots and dashes, or key them yourself — get letters back.',
          intent: 'decode',
        },
      ],
      note: {
        label: 'ALPHABET',
        title: 'Pick a table first',
        body: 'Latin and Cyrillic share codes, so the alphabet cannot be guessed automatically. The switch sits above the input field.',
      },
    },
  },
  {
    to: '/decoder',
    label: 'Decoder',
    menu: {
      label: 'WHERE THE SIGNAL COMES FROM',
      links: [
        {
          to: '/#translator',
          code: '−·−',
          title: 'Hear the code',
          body: 'A 600 Hz sine tone with exact timing — highlighted as it plays.',
          intent: 'play',
        },
        {
          to: '/decoder',
          code: '···',
          title: 'From the microphone',
          body: 'Hold the phone up to a speaker — text appears live.',
          soon: true,
        },
        {
          to: '/decoder',
          code: '··−·',
          title: 'From an audio file',
          body: 'WAV, MP3, OGG or M4A up to 20 MB. Processed right in the tab.',
          soon: true,
        },
      ],
      note: {
        label: 'PRIVACY',
        title: 'Audio never leaves',
        body: 'Neither a microphone recording nor a file leaves your device — there is nowhere to send them, there is no server.',
      },
    },
  },
  {
    to: '/practice',
    label: 'Sandbox',
    menu: {
      label: 'HOW TO SEND',
      links: [
        {
          to: '/practice',
          code: '−',
          title: 'Straight key',
          body: 'Space, Enter, mouse or touch. You set the speed, thresholds are shown in milliseconds.',
        },
        {
          to: '/practice',
          code: '−·−−',
          title: 'Iambic mode',
          body: 'Two paddles: one sends dots, the other dashes.',
          soon: true,
        },
      ],
      note: {
        label: 'FEEDBACK',
        title: 'See how you are heard',
        body: 'While you key, a live ribbon of elements runs alongside what the decoder read from them. A mistake shows immediately, not at the end.',
      },
    },
  },
  {
    to: '/learn',
    label: 'Learn',
    menu: {
      label: 'WHERE TO START',
      links: [
        {
          to: '/learn',
          code: '−·−·',
          title: 'Koch method',
          body: 'Two letters on the first lesson, one more each time after. Full speed from the very start.',
        },
        {
          to: '/learn/reading',
          code: '·−·',
          title: 'Reading texts',
          body: 'Real books instead of random letters. Public domain only.',
        },
      ],
      note: {
        label: 'WHY THIS WAY',
        title: 'Speed is not ramped up',
        body: 'Learning slowly trains the brain to count dots, which then has to be unlearned. So the tempo is adult from the start — only the number of letters grows.',
      },
    },
  },
  {
    to: '/chart',
    label: 'Chart',
    menu: {
      label: 'ALPHABETS',
      links: [
        {
          to: '/chart',
          code: '·−',
          title: 'International',
          body: 'ITU-R M.1677-1: Latin letters, digits, punctuation.',
          table: 'international',
        },
        {
          to: '/chart',
          code: '−···',
          title: 'Cyrillic',
          body: 'The part shared by Ukrainian, Russian and Bulgarian.',
          table: 'cyrillic',
        },
      ],
      note: {
        label: 'SEARCH',
        title: 'Searches both ways',
        body: 'Type a letter to see its code, or type dots and dashes to find the letter.',
      },
    },
  },
  {
    to: '/about',
    label: 'About',
    menu: {
      label: "WHAT'S HERE",
      links: [
        {
          to: '/about/how',
          code: '−··',
          title: 'How it works',
          body: 'One signal representation that every source is reduced to.',
        },
        {
          to: '/about/sources',
          code: '···−',
          title: 'Table sources',
          body: 'Where every code comes from, and what still needs checking.',
        },
        {
          to: '/about/privacy',
          code: '·−·−',
          title: 'Privacy',
          body: 'Why zero network requests is a property, not a promise.',
        },
      ],
      note: {
        label: 'STATUS',
        title: 'Still in progress',
        body: 'The translator and the chart work. Audio, the straight key, the decoder and the lessons are next.',
      },
    },
  },
]

export function navFor(lang: Lang): NavEntry[] {
  return lang === 'en' ? NAV_EN : NAV_UK
}
