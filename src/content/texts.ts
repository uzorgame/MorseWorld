/**
 * Тексти для читання.
 *
 * Тільки суспільне надбання: автор помер понад сімдесят років тому. Лежать
 * статичним модулем у репозиторії — під час роботи нічого не підвантажується
 * з чужих сайтів, і сторінка читання не робить жодного мережевого запиту.
 *
 * Усі тексти — латиницею: читання йде тільки міжнародною таблицею, тому поля
 * «якою абеткою» тут немає. Порядок Коха визначений лише для латиниці, і
 * тримати кириличну гілку заради самого лише читання не варто.
 *
 * Це уривки, а не повні твори: слухати абзац морзянкою неможливо, а тримати
 * у збірці цілу книжку, з якої використовується перший екран, безглуздо.
 *
 * УВАГА: формулювання уривків і посилання на джерела мають бути звірені з
 * першоджерелом перед v1 — див. SOURCES.md. Машинерія готова, збірка ще ні.
 */

export type ReadingText = {
  id: string
  title: string
  author: string
  /** Рік першої публікації. */
  year: number
  source: { name: string; url: string }
  body: string
}

export const TEXTS: ReadingText[] = [
  {
    id: 'alice-opening',
    title: 'Alice’s Adventures in Wonderland',
    author: 'Lewis Carroll',
    year: 1865,
    source: { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/11' },
    body: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.',
  },
  {
    id: 'pride-opening',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: 1813,
    source: { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/1342' },
    body: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
  },
  {
    id: 'moby-opening',
    title: 'Moby-Dick',
    author: 'Herman Melville',
    year: 1851,
    source: { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/2701' },
    body: 'Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, I thought I would sail about a little.',
  },
]

