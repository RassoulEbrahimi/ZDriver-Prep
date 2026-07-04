// M6B-1 — CapCut + ElevenLabs production kit for Social Batch 01 (READ-ONLY).
//
// Reads the approved batch-01 manifest and the fixed 10-group mapping, then emits
// reusable PRODUCTION SHEETS for a manual video workflow:
//   • video-groups.json        — 10 groups, machine-readable (source of truth)
//   • video-groups.csv         — one row per group (spreadsheet, UTF-8 BOM)
//   • elevenlabs-scripts.csv   — one row per voice clip (60 rows, UTF-8 BOM)
//   • voiceover-review.csv     — one row per question (30 rows): old vs improved
//   • capcut-timeline-guide.md — human step-by-step CapCut instructions
//
// It does NOT generate MP4 video or MP3 audio, adds no dependencies, no ffmpeg,
// and never touches the app. Videos are assembled manually in CapCut; voice is
// generated manually in ElevenLabs. Question/answer/explanation text is copied
// verbatim from the manifest — no driving rules are invented.
//
// Run from the repo root:  node marketing/build-video-groups.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = join(__dirname, '..')
const BATCH_DIR = join(__dirname, 'social-batch-01')

// ---------------------------------------------------------------------------
// Fixed, approved M6B grouping (10 videos × 3 questions). Titles/hooks are
// editable marketing defaults; the id lists are the approved plan.
// ---------------------------------------------------------------------------
const GROUPS = [
  { id: 'G01', title: 'تابلوها و سرعت مجاز',       hook: 'این‌ها رو می‌شناسی؟ 🚦',        ids: ['se-01-03', 'se-03-13', 'se-14-09'] },
  { id: 'G02', title: 'تابلو، چراغ و خودرو',        hook: 'چند تا رو بلدی؟ 🤔',            ids: ['se-12-04', 'se-16-03', 'se-01-17'] },
  { id: 'G03', title: 'تابلو و کمک‌های اولیه',      hook: 'این نکته‌ها مهم‌اند 🚑',         ids: ['se-09-05', 'se-03-27', 'se-11-05'] },
  { id: 'G04', title: 'تابلو، خط‌کشی و فنی',        hook: 'جوابش رو بلدی؟ 🚦',             ids: ['se-07-03', 'se-01-10', 'se-03-23'] },
  { id: 'G05', title: 'تابلوها و قوانین مهم',       hook: 'این‌ها رو اشتباه نزن! 🚦',       ids: ['se-03-04', 'se-11-11', 'se-08-03'] },
  { id: 'G06', title: 'تابلو، ایمنی و خودرو',       hook: 'چقدر بلدی؟ 🤔',                 ids: ['se-02-06', 'se-12-18', 'se-02-26'] },
  { id: 'G07', title: 'تابلو و ایمنی رانندگی',      hook: 'این‌ها رو دیده بودی؟ 🚦',        ids: ['se-04-02', 'se-17-03', 'se-10-04'] },
  { id: 'G08', title: 'تابلو، قانون و فنی خودرو',   hook: 'جوابش رو می‌دونی؟ 🔧',          ids: ['se-15-24', 'se-13-11', 'se-12-25'] },
  { id: 'G09', title: 'تابلو و قوانین رانندگی',     hook: 'این قانون‌ها رو بلدی؟ 🚦',       ids: ['se-06-02', 'se-17-17', 'se-02-07'] },
  { id: 'G10', title: 'تابلو، پارک و فنی',          hook: 'چند تا درست جواب می‌دی؟ 🤔',    ids: ['se-13-06', 'se-14-17', 'se-07-21'] },
]

// Safe PWA/web CTA. Product name spelled exactly رانندگی‌یار.
const CTA = 'تمرین رایگان آیین‌نامه در رانندگی‌یار:\nranandegiyar.info'
const BASE_HASHTAGS = ['#آیین_نامه', '#گواهینامه', '#رانندگی‌یار', '#آموزش_رانندگی']

// Timeline constants (seconds) — see capcut-timeline-guide.md.
const INTRO_SEC = 2
const TICK_SFX_DURATION = 3
const PER_QUESTION_SEC = 11 // question voice + 3s tick + ding + explanation voice
const CTA_SEC = 4
const DING_SFX_MARKER = 'صدای «دینگ» درست روی کاتِ تصویرِ بدون‌پاسخ ← تصویرِ پاسخ (بعد از ۳ ثانیه تیک‌تاک)'

// ---------------------------------------------------------------------------
// Persian digit → words, so ElevenLabs pronounces numbers naturally.
// Covers 0..9999 (dataset only needs up to a few hundred).
// ---------------------------------------------------------------------------
const ONES = ['صفر', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده']
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']

function intToPersianWords(n) {
  if (n < 10) return ONES[n]
  if (n < 20) return TEENS[n - 10]
  if (n < 100) { const t = TENS[Math.floor(n / 10)], r = n % 10; return r ? `${t} و ${ONES[r]}` : t }
  if (n < 1000) { const h = HUNDREDS[Math.floor(n / 100)], r = n % 100; return r ? `${h} و ${intToPersianWords(r)}` : h }
  const th = Math.floor(n / 1000), r = n % 1000
  const head = th === 1 ? 'هزار' : `${intToPersianWords(th)} هزار`
  return r ? `${head} و ${intToPersianWords(r)}` : head
}

// Replace each run of Persian/ASCII digits with its Persian word form.
function normalizeForTts(text) {
  return text.replace(/[۰-۹0-9]+/g, run => {
    const ascii = run.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    const n = Number(ascii)
    return Number.isFinite(n) ? intToPersianWords(n) : run
  })
}

// ---------------------------------------------------------------------------
// Load + validate.
// ---------------------------------------------------------------------------
const manifest = JSON.parse(readFileSync(join(BATCH_DIR, 'manifest.json'), 'utf8'))
const byId = new Map(manifest.videos.map(v => [v.question_id, v]))

const errors = []
if (manifest.videos.length !== 30) errors.push(`manifest has ${manifest.videos.length} videos, expected 30`)

const grouped = GROUPS.flatMap(g => g.ids)
if (grouped.length !== 30) errors.push(`grouped ${grouped.length} ids, expected 30`)
if (new Set(grouped).size !== grouped.length) errors.push('duplicate id(s) across groups')
for (const id of grouped) if (!byId.has(id)) errors.push(`grouped id not in manifest: ${id}`)
for (const v of manifest.videos) if (!grouped.includes(v.question_id)) errors.push(`manifest id not grouped: ${v.question_id}`)

// Every referenced screenshot must exist.
for (const id of grouped) {
  for (const state of ['unanswered', 'revealed']) {
    const rel = `screenshots/${id}_${state}.png`
    if (!existsSync(join(BATCH_DIR, rel))) errors.push(`missing screenshot: ${rel}`)
  }
}
if (errors.length) {
  console.error('✗ validation failed:\n' + errors.map(e => '  - ' + e).join('\n'))
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Build per-question + per-group records.
// ---------------------------------------------------------------------------
// Strip trailing sentence punctuation from a phrase so it can be wrapped in
// «…» inside a larger spoken sentence without an awkward doubled ending.
function stripTrailingPunct(s) {
  return String(s ?? '').trim().replace(/[.!؟،:؛]+$/, '').trim()
}

// Turn the table-oriented `short_explanation` into a clean, natural SPOKEN
// explanation of one or two COMPLETE sentences. Meaning comes straight from the
// app data — nothing is invented. Removes anything that reads badly aloud:
// "=", ellipses, markdown, and mid-sentence semicolons (→ real sentence breaks).
function cleanExplanation(text) {
  let s = String(text ?? '')
  s = s.replace(/[*_`#~]/g, '')          // strip markdown
  s = s.replace(/\s*=\s*/g, ' ')         // no equals signs in speech
  s = s.replace(/…/g, ' ')          // remove … (ellipsis char)
  s = s.replace(/\.{3,}/g, ' ')          // remove literal ...
  s = s.replace(/[؛;]/g, '. ')           // semicolons → sentence break
  s = s.replace(/\s{2,}/g, ' ').trim()   // collapse whitespace
  s = s.replace(/\s+([.،؟!])/g, '$1')    // no space before punctuation
  s = s.replace(/\.\s*\./g, '.').trim()  // no doubled periods
  if (!/[.!؟]$/.test(s)) s += '.'        // ensure a complete-sentence ending
  return s
}

// "Which option is WRONG?" style questions: the correct choice is a FALSE
// statement, so revealing it as گزینه صحیح، would mislead. Detect by the negative
// wording in the QUESTION text (not the answer/explanation).
function isNegativeQuestion(v) {
  return /نادرست|غلط|اشتباه/.test(v.question || '')
}

// Explanation clip: reveal the answer first, then one complete explanation.
//   positive → گزینه صحیح، «<correct_answer>» است. <explanation>
//   negative → گزینه نادرست، «<correct_answer>» است. <why it is not allowed>
function buildExplanationVoice(v) {
  const answer = stripTrailingPunct(v.correct_answer)
  let body = cleanExplanation(v.short_explanation)
  if (isNegativeQuestion(v)) {
    // The prefix already says the option is wrong, so drop a redundant leading
    // "این گزینه نادرست/غلط/اشتباه است." — but only if real text remains.
    const trimmed = body.replace(/^این گزینه (?:نادرست|غلط|اشتباه) است\.\s*/, '')
    if (trimmed.length >= 20) body = trimmed
    return `گزینه نادرست، «${answer}» است. ${body}`
  }
  return `گزینه صحیح، «${answer}» است. ${body}`
}

// Question clip: short, natural framing of the existing question text.
function buildQuestionVoice(v) {
  return v.category === 'signs'
    ? `این تابلو را می‌شناسی؟ ${v.question}`
    : `به این سؤال آیین‌نامه جواب بده: ${v.question}`
}

function buildQuestion(id) {
  const v = byId.get(id)
  const isImage = v.category === 'signs' // batch-01: all signs are image-backed, all others text-only
  const questionVoice = buildQuestionVoice(v)
  const explanationVoice = buildExplanationVoice(v)
  return {
    question_id: id,
    category: v.category,
    is_image: isImage,
    unanswered_png: `screenshots/${id}_unanswered.png`,
    revealed_png: `screenshots/${id}_revealed.png`,
    question_voice_text: questionVoice,
    question_voice_text_tts: normalizeForTts(questionVoice),
    explanation_voice_text: explanationVoice,
    explanation_voice_text_tts: normalizeForTts(explanationVoice),
    include_options: false, // first kit: keep videos short; options not read
  }
}

const groups = GROUPS.map(g => {
  const questions = g.ids.map(buildQuestion)
  // Union of the three questions' hashtags, base tags first.
  const tagSet = [...BASE_HASHTAGS]
  for (const id of g.ids) for (const t of byId.get(id).hashtags) if (!tagSet.includes(t)) tagSet.push(t)
  const caption = `${g.hook}\n\n۳ سؤال آیین‌نامه در این ویدیو 👇\n\n${CTA}\n${tagSet.join(' ')}`
  return {
    video_group_id: g.id,
    video_title: g.title,
    video_hook: g.hook,
    intro_duration_sec: INTRO_SEC,
    estimated_duration_sec: INTRO_SEC + questions.length * PER_QUESTION_SEC + CTA_SEC,
    final_cta_text: CTA,
    questions,
    tick_sfx_duration: TICK_SFX_DURATION,
    ding_sfx_marker: DING_SFX_MARKER,
    caption,
    hashtags: tagSet,
  }
})

// ---------------------------------------------------------------------------
// Safety net: no forbidden marketing wording in any generated copy.
// ---------------------------------------------------------------------------
const BANNED = ['قبولی تضمینی', 'تضمین', 'اپ‌استور', 'گوگل‌پلی', 'مایکت', 'واتساپ', 'WhatsApp', 'App Store', 'Google Play', 'VITE_PAYMENT_IBAN']
const haystack = JSON.stringify(groups)
const hits = BANNED.filter(w => haystack.includes(w))
if (hits.length) { console.error('✗ forbidden wording found: ' + hits.join(', ')); process.exit(1) }

// ---------------------------------------------------------------------------
// CSV helpers (quote everything, double quotes, flatten newlines; UTF-8 BOM).
// ---------------------------------------------------------------------------
const csvCell = v => '"' + String(Array.isArray(v) ? v.join(' ') : (v ?? '')).replace(/\r?\n/g, ' | ').replace(/"/g, '""') + '"'
const csvRows = rows => '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n'

// ---------------------------------------------------------------------------
// 1) video-groups.json
// ---------------------------------------------------------------------------
const jsonOut = {
  batch: 'social-batch-01',
  generated_at: new Date().toISOString(),
  video_count: groups.length,
  questions_per_video: 3,
  cta: CTA,
  groups,
}
writeFileSync(join(BATCH_DIR, 'video-groups.json'), JSON.stringify(jsonOut, null, 2) + '\n', 'utf8')

// ---------------------------------------------------------------------------
// 2) video-groups.csv (one row per group; 3 questions flattened)
// ---------------------------------------------------------------------------
const GROUP_COLS = ['video_group_id', 'video_title', 'video_hook', 'intro_duration_sec', 'estimated_duration_sec', 'tick_sfx_duration', 'ding_sfx_marker', 'final_cta_text', 'caption', 'hashtags']
const Q_FIELDS = ['question_id', 'category', 'is_image', 'unanswered_png', 'revealed_png', 'question_voice_text', 'question_voice_text_tts', 'explanation_voice_text', 'explanation_voice_text_tts', 'include_options']
const header = [...GROUP_COLS]
for (let n = 1; n <= 3; n++) for (const f of Q_FIELDS) header.push(`q${n}_${f}`)
const groupRows = [header]
for (const g of groups) {
  const row = GROUP_COLS.map(c => g[c])
  for (let n = 0; n < 3; n++) for (const f of Q_FIELDS) row.push(g.questions[n][f])
  groupRows.push(row)
}
writeFileSync(join(BATCH_DIR, 'video-groups.csv'), csvRows(groupRows), 'utf8')

// ---------------------------------------------------------------------------
// 3) elevenlabs-scripts.csv (one row per clip; 10×3×2 = 60 rows)
// ---------------------------------------------------------------------------
const CLIP_COLS = ['clip_id', 'video_group_id', 'question_id', 'clip_type', 'text', 'text_tts', 'suggested_filename', 'notes']
const clipRows = [CLIP_COLS]
for (const g of groups) {
  g.questions.forEach((q, i) => {
    const qn = i + 1
    clipRows.push([
      `${g.video_group_id}_q${qn}_question`, g.video_group_id, q.question_id, 'question',
      q.question_voice_text, q.question_voice_text_tts,
      `${q.question_id}_question.mp3`, 'fa · صدای سؤال روی تصویرِ بدون‌پاسخ',
    ])
    clipRows.push([
      `${g.video_group_id}_q${qn}_explanation`, g.video_group_id, q.question_id, 'explanation',
      q.explanation_voice_text, q.explanation_voice_text_tts,
      `${q.question_id}_explanation.mp3`, 'fa · صدای پاسخ و توضیح روی تصویرِ پاسخ',
    ])
  })
}
writeFileSync(join(BATCH_DIR, 'elevenlabs-scripts.csv'), csvRows(clipRows), 'utf8')

// ---------------------------------------------------------------------------
// 4) voiceover-review.csv (one row per question; 30 rows) — old vs improved,
//    so a human can eyeball the spoken explanation before recording.
// ---------------------------------------------------------------------------
const REVIEW_COLS = [
  'video_group_id', 'question_id', 'category', 'question', 'correct_answer',
  'old_short_explanation', 'improved_explanation_voice_text', 'question_voice_text',
  'suggested_question_filename', 'suggested_explanation_filename',
]
const reviewRows = [REVIEW_COLS]
for (const g of groups) {
  for (const q of g.questions) {
    const v = byId.get(q.question_id)
    reviewRows.push([
      g.video_group_id, q.question_id, q.category, v.question, v.correct_answer,
      v.short_explanation, q.explanation_voice_text, q.question_voice_text,
      `${q.question_id}_question.mp3`, `${q.question_id}_explanation.mp3`,
    ])
  }
}
writeFileSync(join(BATCH_DIR, 'voiceover-review.csv'), csvRows(reviewRows), 'utf8')

// ---------------------------------------------------------------------------
// 5) capcut-timeline-guide.md
// ---------------------------------------------------------------------------
const guide = `# CapCut Timeline Guide — Social Batch 01

Manual production guide for the 10 short-form videos. Videos are assembled by hand
in **CapCut**; voice is generated by hand in **ElevenLabs**. This kit only provides
sheets and scripts — it does not generate any MP4 or MP3.

## Project format
- **Canvas: 1080×1920** (vertical, 9:16) — matches the screenshots.
- Screenshots come from \`marketing/social-batch-01/screenshots/\`
  (\`<question_id>_unanswered.png\` and \`<question_id>_revealed.png\`).
- Voice clips: generate in ElevenLabs from \`elevenlabs-scripts.csv\` (use the
  \`text_tts\` column — numbers are already spelled out for Persian).

## Per-question sequence (repeat ×3 per video)
1. **Unanswered PNG** on screen + **question voice** (\`<id>_question.mp3\`).
2. Keep the unanswered PNG + **3-second ticking-clock SFX** (\`tick_sfx_duration = 3\`).
3. **Ding SFX** exactly on the cut from unanswered → revealed.
4. **Revealed PNG** + **explanation voice** (\`<id>_explanation.mp3\`).

≈ 10–12 seconds per question.

## Per-video structure
1. **Intro / hook** (~2s) — show \`video_hook\` (optional title card).
2. **Q1 → Q2 → Q3** sequences (above).
3. **Final CTA** (~3–4s):

\`\`\`
${CTA}
\`\`\`

Estimated total ≈ 40–45s per video.

## Recommended pilot
Produce **G01** first (${GROUPS[0].ids.join(', ')}), confirm the rhythm and audio
levels, then batch the remaining 9.

## Content rules
- Product name is always **رانندگی‌یار**.
- Use only the provided question / answer / explanation text — do not invent rules.
- No guarantee claims, no app-store wording, no messaging-app handles.

## Do NOT commit media
- Export finished videos locally to \`marketing/social-batch-01/videos/\` (git-ignored).
- Save ElevenLabs audio to \`marketing/social-batch-01/audio/\` (git-ignored).
- Only the sheets/guide in this folder are committed — never MP4/MP3.
`
writeFileSync(join(BATCH_DIR, 'capcut-timeline-guide.md'), guide, 'utf8')

// ---------------------------------------------------------------------------
// Console summary.
// ---------------------------------------------------------------------------
console.log(`✓ ${groups.length} video groups, ${grouped.length} questions, ${clipRows.length - 1} ElevenLabs clips.`)
console.log('Wrote:')
for (const f of ['video-groups.json', 'video-groups.csv', 'elevenlabs-scripts.csv', 'voiceover-review.csv', 'capcut-timeline-guide.md']) {
  console.log('  marketing/social-batch-01/' + f)
}
