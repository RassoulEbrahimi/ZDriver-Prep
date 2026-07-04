// M6A-3 — Playwright screenshot capture for social batch 01.
//
// Drives the dev-only capture viewer (?capture=1) and writes 1080x1920 vertical
// PNGs for short-form social videos. Plain Playwright (no test runner).
//
// Marketing tooling only: not imported by the app, not a `vite build` input, and
// never wired into build/prebuild. Screenshots are for manual/CI use.
//
//   viewport 360x640 CSS px @ deviceScaleFactor 3  ->  1080x1920 PNG
//   dark/brand theme pinned by the viewer's capture mode
//
// Usage:
//   node marketing/capture/shoot.mjs                       # every manifest item (60 PNGs)
//   node marketing/capture/shoot.mjs --ids se-13-06,se-03-13   # pilot subset
//   CAPTURE_BASE_URL=http://localhost:5173 node marketing/capture/shoot.mjs  # reuse a server
//
// Prerequisite (one-time): npx playwright install chromium

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync, mkdirSync, statSync, openSync, readSync, closeSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import http from 'node:http'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = join(__dirname, '..', '..')
const BATCH_DIR = join(REPO, 'marketing', 'social-batch-01')
const OUT_DIR = join(BATCH_DIR, 'screenshots')
const PORT = 5173
const STATES = ['unanswered', 'revealed']
const VIEWPORT = { width: 360, height: 640 }
const DSF = 3

// ---- CLI / env: which question ids to capture (default = all) ----
function requestedIds() {
  const argv = process.argv.slice(2)
  const i = argv.indexOf('--ids')
  let raw = i >= 0 ? argv[i + 1] : undefined
  if (process.env.CAPTURE_IDS) raw = process.env.CAPTURE_IDS
  return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : null
}

const manifest = JSON.parse(readFileSync(join(BATCH_DIR, 'manifest.json'), 'utf8'))
const ids = requestedIds()
if (ids) {
  const missing = ids.filter(id => !manifest.videos.some(v => v.question_id === id))
  if (missing.length) {
    console.error(`Unknown question id(s): ${missing.join(', ')}`)
    process.exit(1)
  }
}
const videos = ids ? manifest.videos.filter(v => ids.includes(v.question_id)) : manifest.videos

// ---- helpers ----
function waitForServer(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      const req = http.get(url, res => { res.resume(); resolve() })
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error(`server not reachable at ${url}`))
        else setTimeout(tick, 300)
      })
    }
    tick()
  })
}

// Read a PNG's real pixel dimensions from its IHDR (bytes 16..24).
function pngSize(path) {
  const fd = openSync(path, 'r')
  try {
    const buf = Buffer.alloc(24)
    readSync(fd, buf, 0, 24, 0)
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  } finally {
    closeSync(fd)
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const usingExternal = Boolean(process.env.CAPTURE_BASE_URL)
  const baseUrl = process.env.CAPTURE_BASE_URL || `http://localhost:${PORT}`
  let server = null

  if (!usingExternal) {
    // Run Vite directly via node (single process) so teardown is clean cross-platform.
    const viteBin = join(REPO, 'node_modules', 'vite', 'bin', 'vite.js')
    server = spawn(process.execPath, [viteBin, '--port', String(PORT), '--strictPort'], {
      cwd: REPO, stdio: 'ignore',
    })
    server.on('error', err => { console.error('Failed to start Vite:', err.message) })
  }

  const rows = []
  try {
    await waitForServer(`${baseUrl}/marketing/capture/index.html`)
    const browser = await chromium.launch()
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DSF,
      colorScheme: 'dark',
    })
    const page = await context.newPage()

    for (const v of videos) {
      for (const state of STATES) {
        const url = `${baseUrl}/marketing/capture/index.html?id=${v.question_id}&state=${state}&capture=1`
        // 'load' (not 'networkidle') — Vite's HMR websocket keeps a connection open.
        await page.goto(url, { waitUntil: 'load' })

        // Freeze animations/transitions so no frame is captured mid-animation.
        await page.addStyleTag({
          content: '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}',
        })

        // Fonts ready (Persian webfont), then every image fully decoded.
        await page.evaluate(() => document.fonts.ready)
        await page.evaluate(async () => {
          const imgs = [...document.images]
          await Promise.all(imgs.map(img =>
            img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => {}),
          ))
        })
        // Small settle for the fit-to-height ResizeObserver pass.
        await page.waitForTimeout(200)

        const rel = state === 'unanswered' ? v.screenshot_unanswered : v.screenshot_revealed
        const outPath = join(BATCH_DIR, rel)
        await page.screenshot({ path: outPath }) // full viewport => 1080x1920

        const { width, height } = pngSize(outPath)
        rows.push({ file: rel, width, height, bytes: statSync(outPath).size })
      }
    }

    await browser.close()
  } finally {
    if (server) server.kill()
  }

  // ---- Result table ----
  console.log(`\nCaptured ${rows.length} screenshot(s) into marketing/social-batch-01/:\n`)
  console.log('  ' + 'file'.padEnd(44) + 'dimensions'.padEnd(13) + 'size')
  console.log('  ' + '-'.repeat(44 + 13 + 8))
  for (const r of rows) {
    console.log('  ' + r.file.padEnd(44) + `${r.width}x${r.height}`.padEnd(13) + `${(r.bytes / 1024).toFixed(1)} KB`)
  }
  const bad = rows.filter(r => r.width !== 1080 || r.height !== 1920)
  if (bad.length) {
    console.error(`\n✗ ${bad.length} file(s) are NOT 1080x1920.`)
    process.exit(1)
  }
  console.log(`\n✓ All ${rows.length} screenshot(s) are exactly 1080x1920.`)
}

main().catch(err => { console.error(err); process.exit(1) })
