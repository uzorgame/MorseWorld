import type { PlayStep } from '../core/schedule'

/**
 * Відтворення морзянки через Web Audio.
 *
 * Уся послідовність ставиться в чергу наперед по годиннику AudioContext.
 * Через setTimeout тайминг «пливе» — на слух це чути одразу, тому його тут немає
 * ніде, крім пауз ручного ключа, де подія й так приходить від людини.
 *
 * Проти клацань на кожній крапці — коротка огинаюча гучності: наростання
 * і спад близько 5 мс через setTargetAtTime.
 */

export type PlayOptions = {
  freq: number
  volume: number
  onProgress?: (index: number) => void
  onEnd?: () => void
}

/** Стала часу огинаючої: ~5 мс до майже повної гучності. */
const ENVELOPE = 0.0016

type Mark = { t: number; index: number }

class MorseAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null

  private osc: OscillatorNode | null = null
  private raf = 0
  private endTimer: number | undefined

  private liveOsc: OscillatorNode | null = null
  private liveGain: GainNode | null = null

  /** Контекст створюємо ліниво: до першого звуку він не потрібен. */
  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 1
      this.master.connect(this.ctx.destination)
    }
    return this.ctx
  }

  /** Чи дозволив браузер звучати. Без жесту користувача контекст лишається suspended. */
  get running(): boolean {
    return this.ctx?.state === 'running'
  }

  /**
   * Читаємо стан через функцію навмисно: стан змінюється асинхронно, а
   * пряма перевірка після раннього return звузила б тип і зламала компіляцію.
   */
  private static isRunning(ctx: AudioContext): boolean {
    return ctx.state === 'running'
  }

  /** Синхронна спроба відкрити контекст. Результат не чекаємо — тільки штовхаємо. */
  private nudge(ctx: AudioContext): void {
    if (!MorseAudio.isRunning(ctx)) {
      void ctx.resume().catch(() => {
        /* ще не час */
      })
    }
  }

  /**
   * Спроба відкрити звук.
   *
   * Пастка: коли жесту користувача ще не було, Chrome не відхиляє проміс
   * від resume(), а лишає його висіти без відповіді. Якщо просто зробити
   * await, продовження не настане ніколи — ні звуку, ні повідомлення про
   * блокування. Тому чекаємо не на проміс, а на стан контексту.
   */
  async unlock(): Promise<boolean> {
    const ctx = this.ensure()
    if (ctx.state === 'running') return true

    void ctx.resume().catch(() => {
      /* заблоковано — стан нижче скаже правду */
    })

    await Promise.race([
      new Promise<void>((resolve) => {
        const done = () => {
          if (MorseAudio.isRunning(ctx)) {
            ctx.removeEventListener('statechange', done)
            resolve()
          }
        }
        ctx.addEventListener('statechange', done)
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 150)),
    ])

    return MorseAudio.isRunning(ctx)
  }

  /**
   * Підписка на момент, коли браузер нарешті дозволив звук.
   * Потрібна, щоб запуск сайту заграв одразу після першої дії користувача,
   * а не мовчав до кінця.
   */
  onRunning(cb: () => void): () => void {
    const ctx = this.ensure()
    const handler = () => {
      if (MorseAudio.isRunning(ctx)) cb()
    }
    ctx.addEventListener('statechange', handler)
    return () => ctx.removeEventListener('statechange', handler)
  }

  /** Тривалість послідовності в мілісекундах. */
  static duration(steps: PlayStep[]): number {
    return steps.reduce((sum, s) => sum + s.ms, 0)
  }

  play(steps: PlayStep[], opts: PlayOptions): void {
    this.stop()
    if (steps.length === 0) {
      opts.onEnd?.()
      return
    }

    const ctx = this.ensure()
    const master = this.master
    if (!master) return

    // Якщо нас покликали з обробника події, підштовхнути контекст треба саме
    // тут і синхронно — після await жест уже не вважається дійсним.
    this.nudge(ctx)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = opts.freq

    const gain = ctx.createGain()
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(master)

    // Невеликий запас, щоб перший елемент не обрізався плануванням.
    const t0 = ctx.currentTime + 0.06
    const marks: Mark[] = []

    let t = t0
    let acc = 0
    for (const step of steps) {
      const sec = step.ms / 1000
      if (step.on) {
        gain.gain.setTargetAtTime(opts.volume, t, ENVELOPE)
        gain.gain.setTargetAtTime(0, t + sec, ENVELOPE)
      }
      t += sec
      acc += step.ms
      if (step.on) marks.push({ t: acc, index: step.index })
    }

    osc.start(t0)
    osc.stop(t + 0.08)
    this.osc = osc

    // Прогрес читаємо з того самого годинника, що й звук, — інакше підсвічування
    // поступово розійдеться зі слухом.
    if (opts.onProgress) {
      let cursor = 0
      const tick = () => {
        const elapsed = (ctx.currentTime - t0) * 1000
        while (cursor < marks.length && marks[cursor]!.t <= elapsed) {
          opts.onProgress!(marks[cursor]!.index)
          cursor++
        }
        if (cursor < marks.length) this.raf = requestAnimationFrame(tick)
      }
      this.raf = requestAnimationFrame(tick)
    }

    if (opts.onEnd) {
      this.endTimer = window.setTimeout(opts.onEnd, acc + 120)
    }
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    window.clearTimeout(this.endTimer)
    this.endTimer = undefined

    if (this.osc) {
      try {
        this.osc.stop()
      } catch {
        /* уже зупинений */
      }
      this.osc.disconnect()
      this.osc = null
    }
  }

  /** ---------- живий тон для ручного ключа ---------- */

  keyDown(freq: number, volume: number): void {
    const ctx = this.ensure()
    if (!this.master || this.liveOsc) return
    this.nudge(ctx)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq

    const gain = ctx.createGain()
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(this.master)

    osc.start()
    gain.gain.setTargetAtTime(volume, ctx.currentTime, ENVELOPE)

    this.liveOsc = osc
    this.liveGain = gain
  }

  keyUp(): void {
    const ctx = this.ctx
    const osc = this.liveOsc
    const gain = this.liveGain
    if (!ctx || !osc || !gain) return

    gain.gain.setTargetAtTime(0, ctx.currentTime, ENVELOPE)
    osc.stop(ctx.currentTime + 0.05)
    this.liveOsc = null
    this.liveGain = null
  }
}

export const audio = new MorseAudio()
