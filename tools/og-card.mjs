/* The link preview card, drawn rather than photographed.
 *
 * Every chat that shows a link to this site shows this file, so it is the first
 * and often the only thing anyone sees of it. It is generated instead of being
 * cropped out of a screenshot for the same reason the boot screen computes its
 * marquee: a hand-made image goes stale silently, and the one thing this site
 * must not get wrong is the code itself.
 *
 * Run it with `npm run og`.
 *
 * The three faces are the site's own, read straight out of node_modules rather
 * than vendored beside this file. They are variable fonts and register only
 * their default instance, so weight is added by stroking the outline — the same
 * thing a browser does when asked for a bold it has not got. */
import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

/* The encoder and the table are the site's own, imported straight from source:
   Node strips the type annotations, and both files carry nothing but `import
   type`. Copying the codes in here would be the one mistake this project
   refuses to make. */
import { encodeText } from '../src/core/encode.ts'
import { international } from '../src/core/tables/international.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

const font = (pkg, file, name) =>
  GlobalFonts.registerFromPath(join(ROOT, 'node_modules/@fontsource-variable', pkg, 'files', file), name)
font('manrope', 'manrope-latin-wght-normal.woff2', 'MANROPE')
font('inter', 'inter-latin-wght-normal.woff2', 'INTER')
font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2', 'JBM')

/* The site's own tokens, resolved out of oklch once. */
const BG = '#FBFDFD'
const INK = '#000102'
const BODY = '#565C5E'
const MUTED = '#757C7E'
const LINE = '#D5DADC'
const ACCENT = '#EB3B29'

const W = 1200
const H = 630
const M = 80

const c = createCanvas(W, H)
const g = c.getContext('2d')

const write = (s, x, y, size, fam, weight, colour, align) => {
  g.font = `${size}px ${fam}`
  const w = g.measureText(s).width
  const at = align === 'right' ? x - w : x
  g.fillStyle = colour
  g.strokeStyle = colour
  g.lineWidth = weight
  g.lineJoin = 'round'
  g.fillText(s, at, y)
  if (weight > 0) g.strokeText(s, at, y)
  return w
}

const round = (x, y, w, h, r) => {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
  g.fill()
}

/* The field: the site's own paper, framed like the cards on the site are. */
g.fillStyle = BG
g.fillRect(0, 0, W, H)
g.strokeStyle = LINE
g.lineWidth = 1
g.strokeRect(0.5, 0.5, W - 1, H - 1)

/* The mark, exactly as the browser tab carries it: dash, dash, dot — a signal
   fading to a point. Outlined here because its own tile is white and the paper
   under it is very nearly white too. */
const markAt = (x, y, s) => {
  const u = s / 32
  g.fillStyle = '#FFFFFF'
  round(x, y, s, s, 7.5 * u)
  g.strokeStyle = LINE
  g.lineWidth = 1
  g.beginPath()
  g.roundRect(x + 0.5, y + 0.5, s - 1, s - 1, 7.5 * u)
  g.stroke()
  g.fillStyle = '#0B0E0F'
  round(x + 5 * u, y + 7 * u, 22 * u, 4.5 * u, 2.25 * u)
  round(x + 5 * u, y + 14 * u, 13.5 * u, 4.5 * u, 2.25 * u)
  g.fillStyle = '#F0410F'
  g.beginPath()
  g.arc(x + 7.25 * u, y + 23.5 * u, 2.25 * u, 0, Math.PI * 2)
  g.fill()
}
markAt(M, 72, 92)

write('MorseWorld', M, 322, 104, 'MANROPE', 9, INK)

write('Translate Morse both ways, hear it at any speed.', M, 392, 29, 'INTER', 0.3, BODY)
write('Key it by hand and learn to copy by ear.', M, 438, 29, 'INTER', 0.3, BODY)

/* The band is a real transmission, not an ornament: the word is run through the
   site's own encoder, and the gaps stand at the ratios the site sounds them at —
   one unit inside a character, three between characters, seven between words.
   Anyone who can read Morse can read this card.
 *
 * The unit is not a chosen number: it is whatever makes the transmission end
 * exactly on the right margin, so the band lines up with the rule and the
 * footer under it. Change the word and the drawing refits itself instead of
 * running off the edge. */
const BAND = 'MORSE'
;(() => {
  const words = encodeText(BAND, international)
    .split(' / ')
    .map((word) => word.split(' '))

  /* Width in units first, with nothing drawn: dot 1, dash 3, one unit between
     elements, three between characters, seven between words. */
  const units =
    words.reduce(
      (total, word) =>
        total +
        word.reduce((sum, ch) => sum + [...ch].reduce((n, el) => n + (el === '-' ? 3 : 1), 0) + ch.length - 1, 0) +
        (word.length - 1) * 3,
      0,
    ) + (words.length - 1) * 7

  const u = (W - 2 * M) / units
  const y = 492
  let x = M
  g.fillStyle = ACCENT

  words.forEach((word, wi) => {
    if (wi) x += 7 * u
    word.forEach((ch, ci) => {
      if (ci) x += 3 * u
      ;[...ch].forEach((el, ei) => {
        if (ei) x += u
        const w = (el === '-' ? 3 : 1) * u
        round(x, y, w, u, u / 2)
        x += w
      })
    })
  })
})()

g.strokeStyle = LINE
g.lineWidth = 1
g.beginPath()
g.moveTo(M, 566.5)
g.lineTo(W - M, 566.5)
g.stroke()

write('uz-or.com/MorseWorld', M, 601, 19, 'JBM', 0.2, MUTED)
write('NO ACCOUNT · NO SERVER · FREE', W - M, 601, 19, 'JBM', 0.2, MUTED, 'right')

const out = join(ROOT, 'public', 'og-image.png')
writeFileSync(out, c.toBuffer('image/png'))
console.log(`og-image.png — ${W}x${H}, band reads "${BAND}"`)
