import type { Lang } from '../state/lang'

/**
 * Назва й опис кожної адреси.
 *
 * Одне джерело на дві потреби. Збірка розкладає з нього по справжньому
 * `index.html` на кожен маршрут — інакше статичний хостинг віддавав би 404 на
 * прямий захід, а всі сторінки склеїлися б в одну адресу для пошуку. А застосунок
 * бере з нього заголовок вкладки, коли маршрут або мова змінилися.
 *
 * Через це назва в коді й назва, яку бачить краулер, не можуть розійтися: вони
 * та сама строка.
 */
export type RouteMeta = {
  /** Без ведучої косої: '' — головна, 'learn/reading' — вкладена. */
  path: string
  title: Record<Lang, string>
  description: Record<Lang, string>
}

const SITE = 'MorseWorld'

export const ROUTES: RouteMeta[] = [
  {
    path: '',
    title: {
      en: 'MorseWorld — translate, practise, learn',
      uk: 'MorseWorld — переклад, тренування, навчання',
    },
    description: {
      en: 'A client-side tool for working with Morse code: encoding, decoding from audio, hands-on practice and learning by the Koch method.',
      uk: 'Клієнтський інструмент для роботи з азбукою Морзе: кодування, декодування зі звуку, ручна практика й навчання за методом Коха.',
    },
  },
  {
    path: 'practice',
    title: { en: `Sandbox — straight key — ${SITE}`, uk: `Пісочниця — ручний ключ — ${SITE}` },
    description: {
      en: 'Key Morse by hand from the keyboard, mouse or touch and watch it decoded live, with the dot, dash and gap boundaries shown in milliseconds.',
      uk: 'Відстукуйте морзянку рукою з клавіатури, миші або тачу й дивіться, як її читають наживо: межі крапки, тире й паузи показані в мілісекундах.',
    },
  },
  {
    path: 'learn',
    title: { en: `Koch method — ${SITE}`, uk: `Метод Коха — ${SITE}` },
    description: {
      en: 'Learn Morse at full character speed from the first lesson, in three directions: meeting a character, sending it by hand, and copying it by ear.',
      uk: 'Вчіть морзянку на повній швидкості знаків із першого уроку в трьох напрямах: знайомство зі знаком, передавання рукою, приймання на слух.',
    },
  },
  {
    path: 'learn/reading',
    title: { en: `Reading texts — ${SITE}`, uk: `Читання текстів — ${SITE}` },
    description: {
      en: 'Practise on public-domain excerpts instead of random letters, in both directions: copy what you hear, or key what you see.',
      uk: 'Тренуйтеся на уривках із суспільного надбання замість випадкових літер, в обидва боки: записуйте почуте або відстукуйте побачене.',
    },
  },
  {
    path: 'chart',
    title: { en: `Character chart — ${SITE}`, uk: `Таблиця символів — ${SITE}` },
    description: {
      en: 'Every sign with its code, searchable in both directions. Latin and Cyrillic share codes, so the alphabet is an explicit choice.',
      uk: 'Кожен знак зі своїм кодом, із пошуком в обидва боки. Латиниця й кирилиця мають спільні коди, тому абетка — явний вибір.',
    },
  },
  {
    path: 'decoder',
    title: { en: `Decoder: microphone and file — ${SITE}`, uk: `Декодер: мікрофон і файл — ${SITE}` },
    description: {
      en: 'The planned pipeline for decoding a tone from the microphone or an audio file: signal, Goertzel, threshold, core. Specified, not yet built.',
      uk: 'Запланований конвеєр для розшифровки тону з мікрофона або аудіофайлу: сигнал, Ґьорцель, поріг, ядро. Описаний, ще не зроблений.',
    },
  },
  {
    path: 'about',
    title: { en: `About — ${SITE}`, uk: `Про проєкт — ${SITE}` },
    description: {
      en: 'What MorseWorld is, what is in the first version, and where the reading texts come from. No server, no account, no network after load.',
      uk: 'Що таке MorseWorld, що входить у першу версію і звідки взяті тексти для читання. Без сервера, без реєстрації, без мережі після завантаження.',
    },
  },
  {
    path: 'about/how',
    title: { en: `How it works — ${SITE}`, uk: `Як влаштовано — ${SITE}` },
    description: {
      en: 'One representation of the signal that every source reduces to, and how a hand-keyed press becomes a letter.',
      uk: 'Одне представлення сигналу, до якого зводяться всі джерела, і як натискання руки стає літерою.',
    },
  },
  {
    path: 'about/sources',
    title: { en: `Table sources — ${SITE}`, uk: `Джерела таблиць — ${SITE}` },
    description: {
      en: 'Where each code table came from and what still needs checking against a primary source.',
      uk: 'Звідки взято кожну таблицю кодів і що ще потребує звірки з першоджерелом.',
    },
  },
  {
    path: 'about/privacy',
    title: { en: `Privacy — ${SITE}`, uk: `Приватність — ${SITE}` },
    description: {
      en: 'Nothing leaves your device. Not a promise in a policy but a property of the architecture: there is no backend to send anything to.',
      uk: 'Нічого не покидає ваш пристрій. Не обіцянка в політиці, а властивість архітектури: надсилати нікуди, бекенду не існує.',
    },
  },
]

/** Метадані для шляху застосунку ('/practice'). Невідомий шлях — головна. */
export function routeMetaFor(pathname: string): RouteMeta {
  const path = pathname.replace(/^\/+|\/+$/g, '')
  return ROUTES.find((r) => r.path === path) ?? ROUTES[0]!
}
