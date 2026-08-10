# MorseWorld

A browser tool for working with Morse code: translate it, hear it, key it by
hand, and learn to copy it by ear.

Everything runs in the tab. There is no backend, no account, and no network
request after the page has loaded — not because a privacy policy promises it,
but because there is nowhere to send anything.

The interface is in Ukrainian. Repository documentation is in English.

```bash
npm install
npm run dev      # http://localhost:5190
npm run build    # tsc -b && vite build
npm run preview
npm test         # Vitest — no tests written yet, see "Known gaps"
```

## Why another one

There are dozens of Morse translators, and most do the same things. Competing on
a feature list is pointless, so the effort here went into execution:

- Timing that does not drift at forty words per minute.
- No click at the start of every dot.
- A straight key you can type a message on and immediately see how the decoder
  read it.
- Honest behaviour when the browser refuses audio.
- Never showing a code the project cannot source. Where something is unverified,
  the interface says so instead of guessing — see [SOURCES.md](SOURCES.md).

## What works

| Page | State |
| --- | --- |
| `/` translator | Text ↔ Morse, both directions, on every keystroke. Direction is detected automatically. Plays with progressive highlighting, exports nothing yet. |
| `/practice` sandbox | Straight key from keyboard, mouse or touch. Thresholds come from the speed you choose and are shown in milliseconds. Diagnoses what the current speed misreads and offers a better one. |
| `/learn` Koch method | Three modes: **introduction** (hear the letter, see its code), **sending** (key what you are shown), **copying** (write down what you hear). Full character speed from lesson one, Farnsworth spacing. Separate lesson level per mode. Per-letter statistics drive which letters come up next. |
| `/learn/reading` | Three public-domain excerpts, split into short passages. Copy them by ear or key them by hand. |
| `/chart` | Every code in the active table, searchable by letter or by code prefix. |
| `/about` + 3 subpages | How it is built, where the tables come from, what leaves your device. |
| `/decoder` | **Not implemented.** Microphone and audio-file decoding are the next stage. |

## How it is built

```
src/core/      pure logic — numbers in, numbers out, no DOM
src/audio/     Web Audio playback and the live key tone
src/state/     table selection, language, learning progress
src/content/   the reading corpus, as a static module
src/pages/     routes
src/components/ shell, translator, practice, learn, boot sequence
src/lib/       scroll, plural agreement, translator intents
```

`src/core` imports nothing from the browser. That is what makes the delicate
part — timing — testable as plain arithmetic rather than by ear.

The single intermediate representation is `PlayStep[]`: a sequence of
"signal on / signal off" steps with durations in milliseconds. Text, the manual
key, and eventually the microphone are all just adapters to it, so a new source
does not require new logic.

### Decisions worth knowing about

**Audio is scheduled on the `AudioContext` clock, not on timers.** Timers give a
rhythm that drifts, and drift is audible immediately. A ~5 ms gain envelope
removes the click at the edge of every element.

**Key timing is read from `event.timeStamp`, not from when the handler ran.** The
first keypress on a page builds the `AudioContext`, which blocks the thread long
enough that a short dot used to be measured as a dash. The event knows when it
actually happened.

**Practice thresholds come from the speed you pick, not from your keying.**
Estimating them adaptively was implemented, and then removed: in real keying the
gaps inside a character and the gaps between characters merge into one
continuous spread, so no clustering can separate them — and a threshold that
moves by itself cannot be learned. A speed you chose stays put and is shown in
milliseconds, so you can aim at it. When your keying does not fit it, the page
says which measurement is wrong and offers the speed that would fit.

**Farnsworth applies to the key as well as to playback.** Someone composing a
transmission has to recall each character before sending it, so their
inter-character pauses are several times longer than nominal while the characters
themselves are correct. Judging those pauses at character speed turned every
letter into its own word.

**Scoring aligns before it compares.** A single missed character shifts
everything after it, so positional comparison blames letters that were heard
correctly. Levenshtein alignment with backtracking is used instead, for both
directions — it is what makes the per-letter statistics trustworthy enough to
drive the drill selection.

## Learning progress

Stored in `localStorage`, nothing else. That is the same "nothing leaves your
device" promise, applied in practice — with the consequence that progress does
not travel between browsers and is lost if you clear site data.

It is kept because it is useful, not for a report: letters you fail to recognise
come up more often, and letters you fail to *send* come up more often in the
sending drill.

## Known gaps

Stated plainly, because the project's whole argument is that it does not
overclaim.

- **No tests.** Vitest is installed and `npm test` is wired up; nothing is
  written yet. `src/core/keyDecoder.ts` has been rewritten twice with no safety
  net. This is the largest hole in the project and it is not a feature.
- **The decoder is a stub.** Microphone and audio file are unbuilt.
- **The UA/EN switch only changes the boot sequence.** The rest of the interface
  is Ukrainian regardless of the selection.
- **Three reading excerpts were entered from memory** and are marked ⚠️ in
  [SOURCES.md](SOURCES.md) pending a word-for-word check.
- **The Cyrillic tables have no citation**, and the Ukrainian one is unverified
  and therefore not offered in the interface.
- **No first-run path.** The lesson pages are clear once you know the site; they
  do not yet answer "I have never done this, what do I press".
- **No licence file.** One still has to be chosen; until then, treat the code as
  all rights reserved. The reading excerpts are public domain independently of
  this.

## Browser support

The stated target is Chrome and Edge 113+, Firefox 141+, Safari 17+, and offline
operation after the first visit. This has not been verified across that matrix.

## Stack

TypeScript in strict mode (`noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`), Vite 6, React 18, React Router 6, Web Audio API,
Vitest. Fonts are self-hosted via Fontsource; smooth scrolling uses Lenis.
