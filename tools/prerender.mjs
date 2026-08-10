/* One real file per route, plus the sitemap that lists them.
 *
 * The site is served as static files, and a static host answers a request for a
 * path it has no file for with a 404 — so `/MorseWorld/practice` would fail on a
 * direct visit or a reload even though the app knows that route perfectly well.
 *
 * Routing on the hash avoids that and costs more than it saves: everything after
 * `#` is an anchor, not an address, so all eleven pages collapse into one URL for
 * a search engine and ten of them stop existing. Writing the file instead keeps
 * the plain path, answers 200, and gives every page its own title, description
 * and canonical — which is also what the neighbouring quirePDF does for its
 * hundred and sixty-odd pages.
 *
 * Runs as part of `npm run build`. The head is rewritten from the same manifest
 * the app reads at runtime, so the tab title and the crawler's title cannot drift
 * apart. English, because that is the site's default language; the app replaces
 * both the moment it decides otherwise.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

import { ROUTES } from '../src/i18n/routes.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = join(HERE, '..', 'dist')
const SITE = 'https://uz-or.com/MorseWorld/'

const shell = readFileSync(join(DIST, 'index.html'), 'utf8')

/** Замінити вміст тега, не покладаючись на те, як його відформатував Vite. */
const swapTitle = (html, title) => html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)

const swapMeta = (html, selector, value) => {
  const attr = selector.startsWith('og:') || selector.startsWith('twitter:') ? 'property' : 'name'
  const key = attr === 'property' && selector.startsWith('twitter:') ? 'name' : attr
  const re = new RegExp(`(<meta\\s+${key}="${selector}"[\\s\\S]*?content=")[\\s\\S]*?(")`)
  return html.replace(re, `$1${value}$2`)
}

const swapLink = (html, rel, href) =>
  html.replace(new RegExp(`(<link rel="${rel}" href=")[^"]*(")`), `$1${href}$2`)

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const stamp = new Date().toISOString().slice(0, 10)
const written = []

for (const route of ROUTES) {
  const url = SITE + route.path + (route.path ? '/' : '')
  const title = escape(route.title.en)
  const description = escape(route.description.en)

  let html = swapTitle(shell, title)
  html = swapMeta(html, 'description', description)
  html = swapMeta(html, 'og:title', title)
  html = swapMeta(html, 'og:description', description)
  html = swapMeta(html, 'og:url', url)
  html = swapMeta(html, 'twitter:title', title)
  html = swapMeta(html, 'twitter:description', description)
  html = swapLink(html, 'canonical', url)

  const dir = route.path ? join(DIST, route.path) : DIST
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html, 'utf8')
  written.push([route.path, url])
}

/* Свій sitemap, як у quirePDF: портфоліо збирає домен з таких списків, а не
   тримає їх переліченими вручну. */
const urls = written.map(
  ([path, url]) =>
    `  <url><loc>${url}</loc><lastmod>${stamp}</lastmod>` +
    `<changefreq>monthly</changefreq><priority>${path ? '0.7' : '0.8'}</priority></url>`,
)
writeFileSync(
  join(DIST, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n'),
  'utf8',
)

console.log(`prerender — ${written.length} routes, sitemap.xml with ${urls.length} URLs`)
