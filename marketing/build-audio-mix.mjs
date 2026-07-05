// M6B-3 — Local audio-mix automation for the social batch (LOCAL / dev only).
//
// Assembles per-question and per-video voiceover tracks from LOCAL media using
// the system ffmpeg. Reads the committed production sheet (video-groups.json) but
// all audio inputs and outputs are LOCAL, git-ignored artifacts — nothing here is
// committed, no npm dependency is added, and the app is untouched.
//
// Per question it concatenates:  question voice → tick_3s → ding → explanation voice
//   (+ an optional N-second silent "promo" gap after the explanation, for a
//    manually-placed promo/outro card in CapCut).
// Then per group it concatenates the question mixes into one <GROUP>_full_audio.mp3.
//
// Inputs (local, git-ignored):
//   marketing/social-batch-01/audio/<question_id>_question.mp3
//   marketing/social-batch-01/audio/<question_id>_explanation.mp3
//   marketing/social-batch-01/audio-mix/tick_3s.mp3
//   marketing/social-batch-01/audio-mix/ding.mp3
// Outputs (local, git-ignored):
//   marketing/social-batch-01/audio-mix/<GROUP>_Q<n>_mix.mp3
//   marketing/social-batch-01/audio-mix/<GROUP>_full_audio.mp3
//   marketing/social-batch-01/audio-mix/<GROUP>_timeline.csv   (CapCut markers)
//   marketing/social-batch-01/audio-mix/<GROUP>_timeline.md    (human-friendly)
//
// Usage:
//   node marketing/build-audio-mix.mjs                 # M6B-3a: G01 only (default)
//   node marketing/build-audio-mix.mjs --groups G01
//   node marketing/build-audio-mix.mjs --groups G01,G02
//   node marketing/build-audio-mix.mjs --groups G02 --promo-gap-seconds 3
// ffmpeg must be installed locally (PATH, or FFMPEG_PATH env, or winget install).

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BATCH_DIR = join(__dirname, 'social-batch-01')
const AUDIO_DIR = join(BATCH_DIR, 'audio')        // ElevenLabs voice clips
const MIX_DIR = join(BATCH_DIR, 'audio-mix')      // SFX + generated mixes
const TICK = join(MIX_DIR, 'tick_3s.mp3')
const DING = join(MIX_DIR, 'ding.mp3')

// Output encode target (CapCut-friendly).
const SAMPLE_RATE = '44100'
const BITRATE = '192k'
const CHANNELS = '2'

// ---- CLI ----
function requestedGroups() {
  const argv = process.argv.slice(2)
  const i = argv.indexOf('--groups')
  const raw = i >= 0 ? argv[i + 1] : (process.env.MIX_GROUPS || '')
  const list = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : []
  return list.length ? list : ['G01'] // M6B-3a default
}

// Optional silent gap (seconds) inserted after each explanation for a manually
// placed promo/outro card in CapCut. 0 = no gap (default, G01 behavior).
function promoGapSeconds() {
  const argv = process.argv.slice(2)
  const i = argv.indexOf('--promo-gap-seconds')
  const v = i >= 0 ? parseFloat(argv[i + 1]) : parseFloat(process.env.PROMO_GAP_SECONDS || '0')
  return Number.isFinite(v) && v > 0 ? v : 0
}

// ---- Resolve local ffmpeg / ffprobe (no npm dependency) ----
function runsOk(bin) {
  try { return spawnSync(bin, ['-version'], { encoding: 'utf8' }).status === 0 } catch { return false }
}
function findExe(baseDir, name, depth = 6) {
  if (!existsSync(baseDir)) return null
  const stack = [[baseDir, 0]]
  while (stack.length) {
    const [dir, d] = stack.pop()
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { continue }
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isFile() && e.name.toLowerCase() === name) return full
      if (e.isDirectory() && d < depth) stack.push([full, d + 1])
    }
  }
  return null
}
function resolveFfmpeg() {
  // 1) explicit env override
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    const dir = dirname(process.env.FFMPEG_PATH)
    const probe = process.env.FFPROBE_PATH && existsSync(process.env.FFPROBE_PATH)
      ? process.env.FFPROBE_PATH : join(dir, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe')
    return { ffmpeg: process.env.FFMPEG_PATH, ffprobe: existsSync(probe) ? probe : null }
  }
  // 2) on PATH
  if (runsOk('ffmpeg')) return { ffmpeg: 'ffmpeg', ffprobe: runsOk('ffprobe') ? 'ffprobe' : null }
  // 3) Windows winget install location
  if (process.platform === 'win32') {
    const base = join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages')
    const hit = findExe(base, 'ffmpeg.exe')
    if (hit) {
      const probe = join(dirname(hit), 'ffprobe.exe')
      return { ffmpeg: hit, ffprobe: existsSync(probe) ? probe : null }
    }
  }
  return null
}

function die(msg) { console.error('✗ ' + msg); process.exit(1) }

const tools = resolveFfmpeg()
if (!tools) {
  die('ffmpeg not found. Install it (e.g. `winget install Gyan.FFmpeg`) or set FFMPEG_PATH. ' +
      'This script uses the system ffmpeg and adds no npm dependency.')
}
console.log(`ffmpeg: ${tools.ffmpeg}`)
console.log(`ffprobe: ${tools.ffprobe ?? '(not found — durations via ffmpeg fallback)'}`)

// ---- Load groups + validate inputs ----
const manifest = JSON.parse(readFileSync(join(BATCH_DIR, 'video-groups.json'), 'utf8'))
const groupsById = new Map(manifest.groups.map(g => [g.video_group_id, g]))
const groups = requestedGroups()

const missingGroups = groups.filter(g => !groupsById.has(g))
if (missingGroups.length) die(`unknown group(s): ${missingGroups.join(', ')}`)

for (const f of [TICK, DING]) if (!existsSync(f)) die(`missing sound effect: ${f}`)

const missingVoice = []
for (const gid of groups) {
  for (const q of groupsById.get(gid).questions) {
    for (const kind of ['question', 'explanation']) {
      const f = join(AUDIO_DIR, `${q.question_id}_${kind}.mp3`)
      if (!existsSync(f)) missingVoice.push(f)
    }
  }
}
if (missingVoice.length) die('missing voice clip(s):\n' + missingVoice.map(f => '  - ' + f).join('\n'))

// ---- ffmpeg helpers ----
// Concatenate audio SEGMENTS into one MP3 (44.1kHz/192kbps). Each segment is
// either a file path (string) or a silence spec `{ silence: seconds }` — silence
// is synthesized with lavfi anullsrc, so no input file is created or modified.
// Every segment is normalized to a common format first (inputs may differ).
function concatAudio(segments, outPath) {
  if (existsSync(outPath)) console.log(`  (overwriting existing ${outPath.replace(BATCH_DIR + '\\', '').replace(BATCH_DIR + '/', '')})`)
  const inputArgs = []
  const pre = []
  segments.forEach((s, i) => {
    if (typeof s === 'string') inputArgs.push('-i', s)
    else inputArgs.push('-f', 'lavfi', '-t', String(s.silence), '-i', `anullsrc=r=${SAMPLE_RATE}:cl=stereo`)
    pre.push(`[${i}:a]aformat=sample_rates=${SAMPLE_RATE}:channel_layouts=stereo[a${i}]`)
  })
  const chain = segments.map((_, i) => `[a${i}]`).join('')
  const filter = `${pre.join(';')};${chain}concat=n=${segments.length}:v=0:a=1[out]`
  const args = [
    ...inputArgs,
    '-filter_complex', filter, '-map', '[out]',
    '-ar', SAMPLE_RATE, '-ac', CHANNELS, '-b:a', BITRATE,
    '-hide_banner', '-loglevel', 'error', '-y', outPath,
  ]
  const r = spawnSync(tools.ffmpeg, args, { encoding: 'utf8' })
  if (r.status !== 0) die(`ffmpeg failed for ${outPath}:\n${r.stderr || r.error}`)
}

function durationSec(file) {
  if (tools.ffprobe) {
    const r = spawnSync(tools.ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' })
    const d = parseFloat((r.stdout || '').trim())
    if (Number.isFinite(d)) return d
  }
  // Fallback: parse "Duration: HH:MM:SS.xx" from ffmpeg stderr.
  const r = spawnSync(tools.ffmpeg, ['-i', file, '-hide_banner'], { encoding: 'utf8' })
  const m = (r.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0
}

const rel = p => p.replace(BATCH_DIR + '\\', '').replace(BATCH_DIR + '/', '')
const fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
const mmss = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`
const kb = p => (statSync(p).size / 1024).toFixed(1) + ' KB'

// Write CapCut timeline markers (CSV with UTF-8 BOM + a human-friendly MD) for a
// group, using timestamps derived from MEASURED audio durations.
function writeTimeline(gid, group, rows, fullPath) {
  const COLS = ['video_group_id', 'question_index', 'question_id', 'segment', 'screenshot_file', 'audio_file', 'start_time', 'end_time', 'duration_sec', 'capcut_instruction']
  const numCols = new Set(['start_time', 'end_time', 'duration_sec'])
  const cell = (r, c) => '"' + String(numCols.has(c) ? Number(r[c]).toFixed(3) : (r[c] ?? '')).replace(/"/g, '""') + '"'
  const csv = '﻿' + [COLS.join(',')].concat(rows.map(r => COLS.map(c => cell(r, c)).join(','))).join('\r\n') + '\r\n'
  writeFileSync(join(MIX_DIR, `${gid}_timeline.csv`), csv, 'utf8')

  const total = rows.length ? rows[rows.length - 1].end_time : 0
  // Per-question anchors: start / reveal (ding end) / end.
  const byQ = new Map()
  for (const r of rows) {
    const q = byQ.get(r.question_index) || { id: r.question_id }
    if (r.segment === 'unanswered') q.start = r.start_time
    if (r.segment === 'ding') q.reveal = r.end_time
    if (r.segment === 'revealed') q.end = r.end_time
    byQ.set(r.question_index, q)
  }
  let md = `# ${gid} — CapCut Timeline (auto-generated, local)\n\n`
  md += `Timestamps are derived from the **measured** durations of the local audio\n`
  md += `clips, so they line up with \`audio-mix/${gid}_full_audio.mp3\` (total **${mmss(total)}**).\n\n`
  md += `## How to use in CapCut\n`
  md += `1. Import \`audio-mix/${gid}_full_audio.mp3\` as the audio bed on a 1080×1920 project.\n`
  md += `2. Place each screenshot on the video track per the timestamps below.\n`
  md += `3. For every question, switch from the **unanswered** to the **revealed** screenshot\n`
  md += `   exactly at its **reveal** time — this is the moment the Ding ends, so keep the\n`
  md += `   Ding aligned with the picture switch.\n\n`
  md += `## Reveal timestamps (quick reference)\n\n`
  md += `| Q | question_id | question starts | REVEAL at (Ding end) | question ends |\n`
  md += `|---|---|---|---|---|\n`
  for (const [n, q] of [...byQ.entries()].sort((a, b) => a[0] - b[0])) {
    md += `| ${n} | ${q.id} | ${mmss(q.start)} | **${mmss(q.reveal)}** | ${mmss(q.end)} |\n`
  }
  md += `\n## Full segment table\n\n`
  md += `| Q | segment | start | end | dur | screenshot | audio |\n`
  md += `|---|---|---|---|---|---|---|\n`
  for (const r of rows) {
    md += `| ${r.question_index} | ${r.segment} | ${mmss(r.start_time)} | ${mmss(r.end_time)} | ${r.duration_sec.toFixed(2)}s | ${r.screenshot_file} | ${r.audio_file} |\n`
  }
  md += `\n> Generated by \`marketing/build-audio-mix.mjs\`. Local & git-ignored — do not commit.\n`
  writeFileSync(join(MIX_DIR, `${gid}_timeline.md`), md, 'utf8')
  return total
}

// ---- Build ----
const outputs = []
const timelineFiles = []
const tickDur = durationSec(TICK)
const dingDur = durationSec(DING)
const promoGap = promoGapSeconds()
if (promoGap > 0) console.log(`promo gap: ${promoGap.toFixed(2)}s of silence after each explanation`)

for (const gid of groups) {
  const group = groupsById.get(gid)
  console.log(`\n▶ ${gid} — ${group.video_title}`)
  const questionMixes = []
  const timeline = []
  let cursor = 0

  group.questions.forEach((q, i) => {
    const n = i + 1
    const id = q.question_id
    const qVoice = join(AUDIO_DIR, `${id}_question.mp3`)
    const eVoice = join(AUDIO_DIR, `${id}_explanation.mp3`)
    const out = join(MIX_DIR, `${gid}_Q${n}_mix.mp3`)
    // question → tick → ding → explanation (+ optional silent promo gap)
    const mixSegments = [qVoice, TICK, DING, eVoice]
    if (promoGap > 0) mixSegments.push({ silence: promoGap })
    concatAudio(mixSegments, out)
    questionMixes.push(out)
    outputs.push({ label: `${gid}_Q${n}_mix.mp3`, path: out, id })

    // Timeline segments (measured durations); the unanswered PNG stays up through
    // question voice + tick + ding, then the reveal happens on the Ding boundary.
    const qd = durationSec(qVoice)
    const ed = durationSec(eVoice)
    const unansPng = `screenshots/${id}_unanswered.png`
    const revPng = `screenshots/${id}_revealed.png`
    const seg = (segment, dur, screenshot, audio, instr) => {
      const start = cursor
      timeline.push({ video_group_id: gid, question_index: n, question_id: id, segment, screenshot_file: screenshot, audio_file: audio, start_time: start, end_time: start + dur, duration_sec: dur, capcut_instruction: instr })
      cursor += dur
    }
    seg('unanswered', qd, unansPng, `audio/${id}_question.mp3`, `نمایش تصویرِ بدون‌پاسخ ${id} — صدای سؤال پخش می‌شود`)
    seg('tick', tickDur, unansPng, 'audio-mix/tick_3s.mp3', 'همان تصویرِ بدون‌پاسخ — ۳ ثانیه صدای تیک‌تاک')
    seg('ding', dingDur, unansPng, 'audio-mix/ding.mp3', 'صدای «دینگ» — درست در پایان این قطعه به تصویرِ پاسخ سوییچ کن')
    seg('revealed', ed, revPng, `audio/${id}_explanation.mp3`, `سوییچ به تصویرِ پاسخ ${id} — صدای توضیح پخش می‌شود`)
    if (promoGap > 0) {
      seg('promo', promoGap, 'manual-promo-card', `(silence ${promoGap.toFixed(2)}s)`, 'Show the Gemini promotional outro card here and apply a subtle zoom if desired.')
    }
  })

  const full = join(MIX_DIR, `${gid}_full_audio.mp3`)
  concatAudio(questionMixes, full)
  outputs.push({ label: `${gid}_full_audio.mp3`, path: full, id: '(Q1+Q2+Q3)' })

  const timelineEnd = writeTimeline(gid, group, timeline, full)
  const fullDur = durationSec(full)
  const delta = Math.abs(fullDur - timelineEnd)
  timelineFiles.push({ gid, rows: timeline.length, timelineEnd, fullDur, delta })
  console.log(`  timeline: ${timeline.length} rows · end ${mmss(timelineEnd)} vs full ${mmss(fullDur)} (Δ ${(delta * 1000).toFixed(0)} ms)`)
}

// ---- Report ----
console.log('\nGenerated audio (local, git-ignored):\n')
console.log('  ' + 'file'.padEnd(24) + 'question'.padEnd(14) + 'duration'.padEnd(10) + 'size')
console.log('  ' + '-'.repeat(24 + 14 + 10 + 8))
for (const o of outputs) {
  console.log('  ' + rel(o.path).replace('audio-mix\\', '').replace('audio-mix/', '').padEnd(24) + String(o.id).padEnd(14) + fmt(durationSec(o.path)).padEnd(10) + kb(o.path))
}
for (const t of timelineFiles) {
  console.log(`  ${t.gid}_timeline.csv / .md   (${t.rows} rows)`)
}
console.log(`\n✓ ${outputs.length} audio + ${timelineFiles.length * 2} timeline file(s) written to marketing/social-batch-01/audio-mix/ (not committed).`)
