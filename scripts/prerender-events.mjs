// Runs after `vite build` (see package.json's "build" script).
//
// Telegram/VK/WhatsApp link-preview bots read the raw HTML of a URL and
// never execute JavaScript, so a client-side React update to <title> or the
// og:* meta tags is invisible to them — they only ever see whatever
// index.html already contains. Since /events/:slug is one static
// index.html for every event (this is a client-side-routed SPA), every
// shared event link previewed as the same generic "Jetūna" card.
//
// This script fixes that at build time: for every published event it makes
// a copy of the already-built dist/index.html with that event's own
// title/description/cover photo baked into the <head>, and writes it to
// dist/events/<slug>/index.html. GitHub Pages serves that file directly for
// a request to /events/<slug>, so a crawler hitting the shared link gets
// the real title + photo — while an actual visitor still boots the normal
// SPA, since the built <script>/<link> tags are left untouched.
//
// Event data changes whenever an organizer creates/edits an event in
// Supabase, which doesn't push to this repo — so the "Deploy to GitHub
// Pages" workflow also runs on a schedule (see .github/workflows/deploy.yml)
// to periodically regenerate these pages, not just on code pushes.

import { createClient } from '@supabase/supabase-js'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SITE_URL = 'https://jetona.ru'
const DIST_DIR = path.resolve('dist')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Collapses newlines/repeated whitespace from free-text organizer input so
// it can safely sit inside a single-line HTML attribute.
function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function truncate(text, max) {
  if (!text || text.length <= max) return text || ''
  return `${text.slice(0, max - 1).trimEnd()}…`
}

// Replaces the content="..." value of a single <meta ... content="..."> tag,
// identified by its name/property attribute — tolerant of the tag's
// name/property="..." and content="..." sitting on separate lines, which is
// how several of these are formatted in index.html.
function setMetaContent(html, attr, newValue) {
  const re = new RegExp(`(<meta\\s+${attr}\\s+content=")[^"]*("\\s*/?>)`)
  return html.replace(re, `$1${escapeHtml(newValue)}$2`)
}

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[prerender-events] Missing Supabase env vars — skipping event page prerendering.')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: events, error } = await supabase
    .from('events')
    .select('slug, title, description, cover_image_url, event_date, venue, city')
    .eq('status', 'active')

  if (error) {
    // Never fail the whole site build/deploy over this — worst case, event
    // links keep showing the generic site-wide preview until the next run.
    console.error('[prerender-events] Failed to fetch events:', error.message)
    return
  }

  const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8')
  let written = 0

  for (const ev of events || []) {
    if (!ev.slug || !ev.title) continue

    const title = `${cleanText(ev.title)} — Jetūna`
    const fallbackDescription = [cleanText(ev.venue), cleanText(ev.city)].filter(Boolean).join(', ')
    const description = truncate(cleanText(ev.description) || fallbackDescription || cleanText(ev.title), 200)
    const image = ev.cover_image_url || `${SITE_URL}/favicon.svg`
    const url = `${SITE_URL}/events/${ev.slug}`

    let html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`)

    html = setMetaContent(html, 'name="description"', description)
    html = setMetaContent(html, 'property="og:title"', title)
    html = setMetaContent(html, 'property="og:description"', description)
    html = setMetaContent(html, 'property="og:url"', url)
    html = setMetaContent(html, 'property="og:image"', image)
    html = setMetaContent(html, 'name="twitter:title"', title)
    html = setMetaContent(html, 'name="twitter:description"', description)
    html = setMetaContent(html, 'name="twitter:image"', image)

    // The site-wide default is "summary" (small thumbnail) since most pages
    // have no photo of their own — an event with a real cover image gets the
    // large-image card instead, so the photo is what a shared link actually
    // shows.
    if (ev.cover_image_url) {
      html = setMetaContent(html, 'name="twitter:card"', 'summary_large_image')
    }

    const outDir = path.join(DIST_DIR, 'events', ev.slug)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'index.html'), html, 'utf8')
    written += 1
  }

  console.log(`[prerender-events] Generated ${written} event page(s) out of ${events?.length || 0} active event(s).`)
}

main()
