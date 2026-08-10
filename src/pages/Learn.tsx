import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { audio } from '../audio/MorseAudio'
import { scoreOf, type Score, type SendScore } from '../core/drill'
import { encodeText } from '../core/encode'
import { MAX_LEVEL, alphabetFor, makeDrill, newcomerFor } from '../core/koch'
import { morseToSteps } from '../core/schedule'
import { gapsFor } from '../core/timing'
import { international } from '../core/tables/international'
import { callsFor } from '../components/shell/CallSign'
import { SendPad } from '../components/learn/SendPad'
import { Slider } from '../components/translator/Slider'
import { counted, countedEn } from '../lib/plural'
import { useLang } from '../state/lang'
import { useProgress, type LessonMode } from '../state/progress'
import { PageHead } from './PageHead'
import './pages.css'
import './learn.css'

const PRETTY = (code: string) => code.replace(/\./g, '·').replace(/-/g, '−')

/** Пробіли між групами до звірки не належать: важливі літери, не розстановка. */
const letters = (value: string) => value.toUpperCase().replace(/\s+/g, '')

/** З якої точності є сенс думати про наступний урок. Класичний поріг Коха. */
const READY_RATE = 0.9
/** І не раніше, ніж літери взагалі встигли прозвучати достатньо разів. */
const READY_SEEN = 5

/**
 * Три режими, і кожен закриває свою прогалину.
 *
 * Знайомство — власне вивчення: звук і літера разом, бо не почувши, який сигнал
 * якій літері відповідає, приймати на слух неможливо в принципі.
 * Передавання — зворотний напрямок, рукою; код доступний підказкою.
 * Приймання — перевірка на швидкість, і ось тут код перед очима шкідливий:
 * він стає шляхом пригадування замість слуху, тому воно й останнє.
 *
 * Порядок від легшого до важчого, і рівень у кожного режиму свій: рука зазвичай
 * відстає від слуху на кілька уроків, і тягти її силою немає сенсу.
 */
const MODES: Record<'uk' | 'en', { id: LessonMode; step: string; label: string; hint: string }[]> = {
  uk: [
    { id: 'intro', step: '01', label: 'ЗНАЙОМСТВО', hint: 'Почути літеру й побачити її код' },
    { id: 'send', step: '02', label: 'ПЕРЕДАВАННЯ', hint: 'Відстукати задане ключем, код видно' },
    { id: 'copy', step: '03', label: 'ПРИЙМАННЯ', hint: 'Слухати й записувати літерами, без коду' },
  ],
  en: [
    { id: 'intro', step: '01', label: 'GETTING TO KNOW', hint: 'Hear the letter and see its code' },
    { id: 'send', step: '02', label: 'SENDING', hint: 'Key what you are shown, code visible' },
    { id: 'copy', step: '03', label: 'COPYING', hint: 'Listen and write letters, no code' },
  ],
}

const STRINGS = {
  uk: {
    title: 'Метод Коха',
    lead: 'Повна швидкість символів із першого уроку. Нарощується кількість літер, а не темп — інакше доведеться переучуватися. Спершу знайомство зі звуком нової літери, потім приймання на слух і передавання рукою.',
    readingLink: 'Читання текстів →',
    lesson: 'УРОК',
    lettersInPlay: 'ЛІТЕРИ В РОБОТІ',
    noSignsYet: 'ЩЕ НЕ БУЛО ЗНАКІВ',
    onSigns: (n: number) => `НА ${counted(n, 'ЗНАКУ', 'ЗНАКАХ', 'ЗНАКАХ')}`,
    prevLesson: 'Попередній урок',
    nextLesson: 'Наступний урок',
    modeAria: 'Режим',
    audioBlocked:
      'Браузер не дозволив звук. Натисніть будь-де на сторінці й спробуйте ще раз — без дозволу вкладка не має права видавати тон.',
    firstTwo: 'ДВІ ПЕРШІ ЛІТЕРИ',
    newLetter: (ch: string) => `НОВА ЛІТЕРА — ${ch}`,
    listenThenTell: 'СПЕРШУ ПОСЛУХАЙТЕ, ПОТІМ РОЗРІЗНЯЙТЕ',
    hear: 'ПОЧУТИ',
    introNote:
      'Код тут показаний навмисно: не побачивши, який сигнал якій літері відповідає, вивчити її неможливо. А от у режимі приймання код закритий — там він став би шляхом пригадування замість слуху, і саме цю звичку метод Коха й прибирає.',
    discriminate: 'РОЗРІЗНЯЛКА',
    lettersCount: (n: number, list: string) => `${n} ЛІТЕРИ: ${list}`,
    start: 'Почати',
    repeat: 'Повторити',
    correct: 'ВІРНО',
    itWas: (ch: string) => `БУЛО ${ch}`,
    next: 'Далі',
    sounding: '● ЗВУЧИТЬ — СЛУХАЙТЕ',
    writeWhatYouHeard: 'ЗАПИШІТЬ, ЩО ПОЧУЛИ',
    result: 'РЕЗУЛЬТАТ',
    readyToSend: 'ГОТОВО ДО ПЕРЕДАЧІ',
    newLetterThis: (ch: string) => `НОВА ЛІТЕРА ЦЬОГО УРОКУ — ${ch}`,
    firstLessonTwo: 'ПЕРШИЙ УРОК: ДВІ ЛІТЕРИ ОДРАЗУ',
    typeHere: 'Пишіть тут…',
    pressSendFirst: 'Спершу натисніть «Передати»',
    heardAria: 'Що ви почули',
    send: 'Передати',
    check: 'Перевірити',
    sounded: 'Прозвучало:',
    sendingByHand: 'ПЕРЕДАВАННЯ РУКОЮ',
    thresholdsFrom: (wpm: number) => `ПОРОГИ — ВІД ${wpm} WPM, ЯК У ПІСОЧНИЦІ`,
    nextGroup: 'Наступна група',
    volume: 'ГУЧНІСТЬ',
    charSpeed: 'ШВИДКІСТЬ ЗНАКІВ',
    effective: 'ЕФЕКТИВНА',
    tone: 'ТОН',
    groups: 'ГРУП У ЗАВДАННІ',
    farnsworthNote: (wpm: number, spacing: number) =>
      `Знаки звучать на ${wpm} WPM і не сповільнюються — сповільнюються тільки паузи між ними, до ефективних ${spacing} WPM. Саме в цьому суть методу: літера від початку чується як одне ціле, а не як лічба крапок. Коли впізнавати стає легко, підтягуйте ефективну швидкість до швидкості знаків, і лише потім беріть наступний урок.`,
    lessonLetters: 'ЛІТЕРИ ЦЬОГО УРОКУ',
    copyStat: (rate: number, n: number) =>
      `ПРИЙМАННЯ ${rate}% НА ${counted(n, 'ЗНАКУ', 'ЗНАКАХ', 'ЗНАКАХ')}`,
    statsAfterCheck: 'СТАТИСТИКА ЗʼЯВИТЬСЯ ПІСЛЯ ПЕРШОЇ ПЕРЕВІРКИ',
    colCopy: 'ПРИЙМАННЯ',
    colSend: 'ПЕРЕДАВАННЯ',
    readyNext: 'ТОЧНІСТЬ ДОЗВОЛЯЄ БРАТИ НАСТУПНИЙ УРОК — ВИРІШУВАТИ ВАМ',
    aimHint: (pct: number) => `ОРІЄНТИР ДЛЯ ПЕРЕХОДУ — ${pct}%, АЛЕ ПОРОГ ВАС НЕ ТРИМАЄ`,
    resetStats: 'Скинути статистику',
  },
  en: {
    title: 'Koch method',
    lead: 'Full character speed from the first lesson. The number of letters grows, not the tempo — otherwise you would have to unlearn it later. First get to know the sound of a new letter, then copy by ear and send by hand.',
    readingLink: 'Reading texts →',
    lesson: 'LESSON',
    lettersInPlay: 'LETTERS IN PLAY',
    noSignsYet: 'NO CHARACTERS YET',
    onSigns: (n: number) => `ON ${countedEn(n, 'CHARACTER', 'CHARACTERS')}`,
    prevLesson: 'Previous lesson',
    nextLesson: 'Next lesson',
    modeAria: 'Mode',
    audioBlocked:
      'The browser blocked audio. Click anywhere on the page and try again — without permission the tab is not allowed to make a sound.',
    firstTwo: 'THE FIRST TWO LETTERS',
    newLetter: (ch: string) => `NEW LETTER — ${ch}`,
    listenThenTell: 'LISTEN FIRST, THEN TELL THEM APART',
    hear: 'HEAR IT',
    introNote:
      'The code is shown here deliberately: without seeing which signal belongs to which letter, learning it is impossible. In copying mode it is hidden — there it would become a path to recall instead of hearing, and that is exactly the habit the Koch method removes.',
    discriminate: 'TELL THEM APART',
    lettersCount: (n: number, list: string) => `${n} LETTERS: ${list}`,
    start: 'Start',
    repeat: 'Repeat',
    correct: 'CORRECT',
    itWas: (ch: string) => `IT WAS ${ch}`,
    next: 'Next',
    sounding: '● SOUNDING — LISTEN',
    writeWhatYouHeard: 'WRITE DOWN WHAT YOU HEARD',
    result: 'RESULT',
    readyToSend: 'READY TO SEND',
    newLetterThis: (ch: string) => `NEW LETTER THIS LESSON — ${ch}`,
    firstLessonTwo: 'FIRST LESSON: TWO LETTERS AT ONCE',
    typeHere: 'Type here…',
    pressSendFirst: 'Press "Send" first',
    heardAria: 'What you heard',
    send: 'Send',
    check: 'Check',
    sounded: 'What sounded:',
    sendingByHand: 'SENDING BY HAND',
    thresholdsFrom: (wpm: number) => `THRESHOLDS — FROM ${wpm} WPM, AS IN THE SANDBOX`,
    nextGroup: 'Next group',
    volume: 'VOLUME',
    charSpeed: 'CHARACTER SPEED',
    effective: 'EFFECTIVE',
    tone: 'TONE',
    groups: 'GROUPS PER DRILL',
    farnsworthNote: (wpm: number, spacing: number) =>
      `Characters sound at ${wpm} WPM and never slow down — only the gaps between them stretch, to an effective ${spacing} WPM. That is the whole point of the method: a letter is heard as one whole from the start, not as a count of dots. When recognising gets easy, pull the effective speed up towards the character speed, and only then take the next lesson.`,
    lessonLetters: 'LETTERS OF THIS LESSON',
    copyStat: (rate: number, n: number) =>
      `COPYING ${rate}% ON ${countedEn(n, 'CHARACTER', 'CHARACTERS')}`,
    statsAfterCheck: 'STATISTICS APPEAR AFTER THE FIRST CHECK',
    colCopy: 'COPYING',
    colSend: 'SENDING',
    readyNext: 'ACCURACY ALLOWS THE NEXT LESSON — YOUR CALL',
    aimHint: (pct: number) => `THE GUIDE FOR MOVING ON IS ${pct}%, BUT NO THRESHOLD HOLDS YOU`,
    resetStats: 'Reset statistics',
  },
} as const

type Phase = 'ready' | 'playing' | 'typing' | 'checked'

/**
 * Уроки йдуть тільки міжнародною таблицею — і читають її напряму, а не з
 * глобального вибору.
 *
 * Порядок Коха визначений лише для латиниці, тому перемикача тут немає. Якби
 * сторінка й далі брала таблицю зі спільного стану, то після вибору КИР на
 * перекладачі уроки показували б заглушку, а виправити це було б нічим —
 * перемикача на сторінці вже немає.
 */
const table = international

export function Learn() {
  const { progress, setLevel, recordChars, recordSent, resetChars } = useProgress()
  const { lang } = useLang()
  const t = STRINGS[lang]
  const modes = MODES[lang]

  const [mode, setMode] = useState<LessonMode>('intro')
  const [wpm, setWpm] = useState(20)
  const [effective, setEffective] = useState(10)
  const [freq, setFreq] = useState(600)
  const [volume, setVolume] = useState(0.25)
  const [groups, setGroups] = useState(4)

  const [target, setTarget] = useState('')
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<Phase>('ready')
  const [score, setScore] = useState<Score | null>(null)
  const [blocked, setBlocked] = useState(false)

  /** Знайомство: що зараз прозвучало й що людина відповіла. */
  const [quiz, setQuiz] = useState('')
  const [answer, setAnswer] = useState('')

  const [sendTask, setSendTask] = useState('')

  const input = useRef<HTMLInputElement>(null)

  // Рівень, абетка й статистика — усе за поточним режимом. Передавання живе
  // на своєму рівні й на своїй статистиці, приймання та знайомство — на слуховій.
  const level = progress.levels[mode]
  const alphabet = alphabetFor(level)
  const newcomer = newcomerFor(level)
  const stats = mode === 'send' ? progress.sent : progress.chars
  const modeLabel = modes.find((m) => m.id === mode)?.label ?? ''

  // Ефективна швидкість не має перевищувати швидкість знаків: Фарнсворт лише
  // розтягує паузи, стиснути їх нижче нормативних він не може.
  const spacing = Math.min(effective, wpm)

  const say = useCallback(
    async (text: string, onDone?: () => void) => {
      const ok = audio.running || (await audio.unlock())
      setBlocked(!ok)
      if (!ok) return

      const steps = morseToSteps(encodeText(text, table, ' ', ' / '), gapsFor(wpm, spacing))
      audio.play(steps, { freq, volume, onEnd: onDone ?? (() => {}) })
    },
    [table, wpm, spacing, freq, volume],
  )

  /* ---------- приймання ---------- */

  const nextCopy = useCallback(() => {
    const drill = makeDrill({ level, groups, groupSize: 5, stats: progress.chars })
    setTarget(drill)
    setTyped('')
    setScore(null)
    setPhase('playing')
    void say(drill, () => {
      setPhase('typing')
      input.current?.focus()
    })
  }, [level, groups, progress.chars, say])

  const check = useCallback(() => {
    if (!target) return
    // Обриваємо звук разом із його onEnd: інакше він дограв би вже після
    // перевірки й перекинув фазу назад у ввід, поверх показаного результату.
    audio.stop()
    const result = scoreOf(letters(target), letters(typed))
    setScore(result)
    recordChars(result.cells)
    setPhase('checked')
  }, [target, typed, recordChars])

  /* ---------- знайомство ---------- */

  /**
   * Розрізнялка йде на трьох літерах: новій і двох попередніх. Саме сусіди по
   * порядку Коха найлегше плутаються, тому вчити треба одне проти іншого,
   * а не проти всієї абетки уроку.
   */
  const introSet = useMemo(() => {
    const all = [...alphabet]
    if (all.length <= 3) return all
    const newest = all[all.length - 1] ?? ''
    return [newest, ...all.slice(0, -1).slice(-2)]
  }, [alphabet])

  const askIntro = useCallback(() => {
    const pick = introSet[Math.floor(Math.random() * introSet.length)] ?? ''
    setQuiz(pick)
    setAnswer('')
    void say(pick)
  }, [introSet, say])

  const answerIntro = (char: string) => {
    if (!quiz || answer) return
    setAnswer(char)
    recordChars([{ target: quiz, typed: char, ok: char === quiz }])
  }

  /* ---------- передавання ---------- */

  const nextSend = useCallback(() => {
    setSendTask(makeDrill({ level, groups: 1, groupSize: 3, stats: progress.sent }))
  }, [level, progress.sent])

  const onSent = useCallback((result: SendScore) => recordSent(result.cells), [recordSent])

  /**
   * Завдання зʼявляється саме — після зміни уроку, таблиці чи входу в режим.
   * Через ref, а не напряму: інакше в залежностях виявилася б статистика, і
   * кожне зараховане очко підсовувало б нове завдання поверх нерозібраного.
   */
  const nextSendRef = useRef(nextSend)
  nextSendRef.current = nextSend

  useEffect(() => {
    if (mode === 'send') nextSendRef.current()
  }, [mode, level])

  /* ---------- спільне ---------- */

  /** Пробіл під час прослуховування скролив би сторінку — і збивав би слух. */
  useEffect(() => {
    if (mode === 'send' || phase !== 'playing') return
    const stop = (e: KeyboardEvent) => {
      if (e.code === 'Space') e.preventDefault()
    }
    window.addEventListener('keydown', stop)
    return () => window.removeEventListener('keydown', stop)
  }, [mode, phase])

  useEffect(() => () => audio.stop(), [])

  /** Зміна уроку, таблиці чи режиму робить поточне завдання неактуальним. */
  useEffect(() => {
    audio.stop()
    setTarget('')
    setTyped('')
    setScore(null)
    setPhase('ready')
    setQuiz('')
    setAnswer('')
  }, [level, mode])

  /* ---------- готовність до наступного уроку ---------- */

  const lessonRate = useMemo(() => {
    let seen = 0
    let hit = 0
    for (const char of alphabet) {
      const stat = stats[char]
      if (!stat) continue
      seen += stat.seen
      hit += stat.hit
    }
    return { seen, rate: seen > 0 ? hit / seen : 0 }
  }, [alphabet, stats])

  const ready = lessonRate.seen >= READY_SEEN * alphabet.length && lessonRate.rate >= READY_RATE

  /** Найслабші літери — за ними й видно, що саме доучувати. */
  const board = useMemo(
    () =>
      [...alphabet]
        .map((char) => {
          const recv = progress.chars[char]
          const sent = progress.sent[char]
          return {
            char,
            code: table.chars[char] ?? '',
            recv: recv ? recv.hit / recv.seen : null,
            recvSeen: recv?.seen ?? 0,
            sent: sent ? sent.hit / sent.seen : null,
            sentSeen: sent?.seen ?? 0,
          }
        })
        .filter((row) => row.recvSeen > 0 || row.sentSeen > 0)
        .sort((a, b) => (a.recv ?? 1) - (b.recv ?? 1)),
    [alphabet, progress.chars, progress.sent, table.chars],
  )

  return (
    <div className="page shell">
      <PageHead
        call={callsFor(lang).learn}
        title={t.title}
        lead={t.lead}
        aside={
          <div className="chart-controls">
            <Link className="btn btn--ghost" to="/learn/reading">
              {t.readingLink}
            </Link>
          </div>
        }
      />

      {/* ---------- урок ---------- */}
      <div className="lsn__bar">
        <span className="lsn__bar-cell">
          <b className="mono">
            {String(level).padStart(2, '0')}
            <span>/{MAX_LEVEL}</span>
          </b>
          {/* Режим підписаний тут навмисно: рівень у кожного свій, і без підпису
              незрозуміло, чий саме показаний. */}
          <span className="micro">
            {t.lesson} · {modeLabel}
          </span>
        </span>

        <span className="lsn__bar-cell lsn__alphabet">
          <span className="micro">{t.lettersInPlay}</span>
          <span className="lsn__chars">
            {[...alphabet].map((char) => (
              <b key={char} data-new={char === newcomer ? '' : undefined}>
                {char}
              </b>
            ))}
          </span>
        </span>

        <span className="lsn__bar-cell">
          <b className="mono">{lessonRate.seen > 0 ? `${Math.round(lessonRate.rate * 100)}%` : '—'}</b>
          <span className="micro">
            {lessonRate.seen > 0 ? t.onSigns(lessonRate.seen) : t.noSignsYet}
          </span>
        </span>

        <span className="lsn__bar-cell lsn__steps">
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => setLevel(mode, level - 1)}
            disabled={level <= 1}
          >
            {t.prevLesson}
          </button>
          <button
            type="button"
            className={ready ? 'btn btn--accent' : 'btn btn--quiet'}
            onClick={() => setLevel(mode, level + 1)}
            disabled={level >= MAX_LEVEL}
          >
            {t.nextLesson}
          </button>
        </span>
      </div>

      {/* ---------- режим ---------- */}
      <div className="lsn__modes" role="group" aria-label={t.modeAria}>
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className="lsn__mode"
            data-active={mode === item.id ? '' : undefined}
            onClick={() => setMode(item.id)}
          >
            <b className="micro">
              <i>{item.step}</i> {item.label}
            </b>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>

      {blocked && <p className="lsn__note">{t.audioBlocked}</p>}

      {/* ---------- знайомство ---------- */}
      {mode === 'intro' && (
        <div className="lsn">
          <div className="lsn__head">
            <span className="micro micro--accent">
              {level === 1 ? t.firstTwo : t.newLetter(newcomer)}
            </span>
            <span className="micro">{t.listenThenTell}</span>
          </div>

          <div className="intro__cards">
            {(level === 1 ? [...alphabet] : [newcomer]).map((char) => (
              <button key={char} type="button" className="intro__card" onClick={() => void say(char)}>
                <b>{char}</b>
                <code className="mono">{PRETTY(table.chars[char] ?? '')}</code>
                <span className="micro">{t.hear}</span>
              </button>
            ))}
          </div>

          <p className="lsn__note">{t.introNote}</p>

          <div className="lsn__head">
            <span className="micro micro--accent">{t.discriminate}</span>
            <span className="micro">{t.lettersCount(introSet.length, introSet.join(' · '))}</span>
          </div>

          <div className="intro__quiz">
            {!quiz ? (
              <button type="button" className="btn btn--accent" onClick={askIntro}>
                {t.start}
              </button>
            ) : (
              <>
                <div className="intro__choices">
                  {introSet.map((char) => (
                    <button
                      key={char}
                      type="button"
                      className="intro__choice"
                      onClick={() => answerIntro(char)}
                      disabled={answer !== ''}
                      data-state={
                        answer === '' ? undefined : char === quiz ? 'right' : char === answer ? 'wrong' : undefined
                      }
                    >
                      {char}
                    </button>
                  ))}
                </div>

                <div className="intro__after">
                  {answer === '' ? (
                    <button type="button" className="btn btn--quiet" onClick={() => void say(quiz)}>
                      {t.repeat}
                    </button>
                  ) : (
                    <>
                      <span className="micro">
                        {answer === quiz ? t.correct : t.itWas(quiz)} ·{' '}
                        {PRETTY(table.chars[quiz] ?? '')}
                      </span>
                      <button type="button" className="btn btn--accent" onClick={askIntro}>
                        {t.next}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---------- приймання ---------- */}
      {mode === 'copy' && (
        <div className="lsn">
          <div className="lsn__head">
            <span className="micro micro--accent">
              {phase === 'playing'
                ? t.sounding
                : phase === 'typing'
                  ? t.writeWhatYouHeard
                  : phase === 'checked'
                    ? t.result
                    : t.readyToSend}
            </span>
            <span className="micro">
              {newcomer ? t.newLetterThis(newcomer) : t.firstLessonTwo}
            </span>
          </div>

          <form
            className="lsn__form"
            onSubmit={(e) => {
              e.preventDefault()
              if (phase === 'checked') nextCopy()
              else if (target) check()
              else nextCopy()
            }}
          >
            <input
              ref={input}
              className="lsn__input mono"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={target ? t.typeHere : t.pressSendFirst}
              spellCheck={false}
              autoComplete="off"
              aria-label={t.heardAria}
              disabled={!target || phase === 'checked'}
            />

            <div className="lsn__actions">
              {!target && (
                <button type="submit" className="btn btn--accent">
                  {t.send}
                </button>
              )}
              {target && phase !== 'checked' && (
                <>
                  <button type="submit" className="btn btn--accent" disabled={typed.length === 0}>
                    {t.check}
                  </button>
                  <button type="button" className="btn btn--quiet" onClick={() => void say(target)}>
                    {t.repeat}
                  </button>
                </>
              )}
              {phase === 'checked' && (
                <button type="submit" className="btn btn--accent">
                  {t.next}
                </button>
              )}
            </div>
          </form>

          {score && (
            <div className="lsn__result">
              <div className="lsn__cells" aria-hidden="true">
                {score.cells.map((cell, i) => (
                  <span key={i} className="lsn__cell" data-ok={cell.ok ? '' : undefined}>
                    <b>{cell.target || '·'}</b>
                    <span>{cell.ok ? '' : cell.typed || '—'}</span>
                  </span>
                ))}
              </div>

              <p className="lsn__tally" aria-live="polite">
                {score.hit} / {score.total} — {Math.round(score.rate * 100)}%. {t.sounded}{' '}
                <b className="mono">{target}</b>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------- передавання ---------- */}
      {mode === 'send' && (
        <div className="lsn">
          <div className="lsn__head">
            <span className="micro micro--accent">{t.sendingByHand}</span>
            <span className="micro">{t.thresholdsFrom(wpm)}</span>
          </div>

          {sendTask && (
            <SendPad
              target={sendTask}
              table={table}
              wpm={wpm}
              effective={spacing}
              freq={freq}
              volume={volume}
              onScored={onSent}
              onNext={nextSend}
              nextLabel={t.nextGroup}
            />
          )}
        </div>
      )}

      {/* ---------- налаштування ---------- */}
      <div className="tr-controls">
        <Slider
          label={t.volume}
          value={Math.round(volume * 100)}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => setVolume(v / 100)}
        />
        <Slider label={t.charSpeed} value={wpm} min={10} max={35} step={1} unit=" WPM" onChange={setWpm} />
        <Slider label={t.effective} value={spacing} min={5} max={35} step={1} unit=" WPM" onChange={setEffective} />
        <Slider label={t.tone} value={freq} min={400} max={1000} step={10} unit=" Hz" onChange={setFreq} />
        {mode === 'copy' && (
          <Slider label={t.groups} value={groups} min={1} max={8} step={1} unit="" onChange={setGroups} />
        )}
      </div>

      <p className="lsn__note">{t.farnsworthNote(wpm, spacing)}</p>

      {/* ---------- статистика ---------- */}
      <div className="lsn__stats">
        <div className="lsn__stats-head">
          <span className="micro micro--accent">{t.lessonLetters}</span>
          <span className="micro">
            {lessonRate.seen > 0
              ? t.copyStat(Math.round(lessonRate.rate * 100), lessonRate.seen)
              : t.noSignsYet}
          </span>
        </div>

        {board.length === 0 ? (
          <span className="micro">{t.statsAfterCheck}</span>
        ) : (
          <ul className="lsn__chart">
            <li className="lsn__chart-head">
              <b />
              <code />
              <span className="micro">{t.colCopy}</span>
              <span className="micro">{t.colSend}</span>
            </li>
            {board.map((row) => (
              <li key={row.char}>
                <b>{row.char}</b>
                <code className="mono">{PRETTY(row.code)}</code>
                <span className="lsn__pair">
                  <span className="lsn__meter" aria-hidden="true">
                    <i
                      style={{ transform: `scaleX(${row.recv ?? 0})` }}
                      data-weak={row.recv !== null && row.recv < READY_RATE ? '' : undefined}
                    />
                  </span>
                  <span className="micro">
                    {row.recv === null ? '—' : `${Math.round(row.recv * 100)}% · ${row.recvSeen}`}
                  </span>
                </span>
                <span className="lsn__pair">
                  <span className="lsn__meter" aria-hidden="true">
                    <i
                      style={{ transform: `scaleX(${row.sent ?? 0})` }}
                      data-weak={row.sent !== null && row.sent < READY_RATE ? '' : undefined}
                    />
                  </span>
                  <span className="micro">
                    {row.sent === null ? '—' : `${Math.round(row.sent * 100)}% · ${row.sentSeen}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="lsn__stats-foot">
          <span className="micro">
            {ready ? t.readyNext : t.aimHint(Math.round(READY_RATE * 100))}
          </span>
          <button type="button" className="btn btn--quiet" onClick={resetChars}>
            {t.resetStats}
          </button>
        </div>
      </div>
    </div>
  )
}
