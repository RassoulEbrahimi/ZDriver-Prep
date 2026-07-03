// M6A — Social batch #01 selector (READ-ONLY w.r.t. the app).
//
// Reads the authored source-exam data under src/data/source-exams/exams/ and
// writes a curated, auditable batch of 30 questions for short-form video.
//
// It does NOT touch production app logic, screens, routing, auth, paywall, or
// entitlement. It only READS the exam .ts data files and WRITES two artifacts:
//   marketing/social-batch-01/manifest.json
//   marketing/social-batch-01/metadata.csv
//
// No screenshots and no Playwright are produced here (that is a later step).
// Selection is fully deterministic: same data in -> same 30 questions out.
//
// Run from the repo root:  node marketing/generate-social-batch-01.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = join(__dirname, '..')
const OUT_DIR = join(__dirname, 'social-batch-01')

// ---------------------------------------------------------------------------
// 1. Load the authored questions.
//
// The exam files are plain data object-literals with a single `import type`
// line and one `: SourceExamData` annotation. We strip those two TS-only bits
// and evaluate the rest as a normal ES module via a data: URL. Nothing is
// imported from the app runtime, so this stays fully decoupled.
// ---------------------------------------------------------------------------
async function loadExam(n) {
  const pad = String(n).padStart(2, '0')
  const file = join(REPO, 'src/data/source-exams/exams', `exam-${pad}.ts`)
  let src = readFileSync(file, 'utf8')
  src = src.replace(/^\s*import type[^\n]*\n/m, '')   // drop `import type { SourceExamData } ...`
  src = src.replace(/:\s*SourceExamData\s*=/, ' =')   // drop the value-position type annotation
  const mod = await import('data:text/javascript,' + encodeURIComponent(src))
  return mod[`exam${pad}`]
}

const ALL = []
for (let n = 1; n <= 17; n++) {
  const exam = await loadExam(n)
  for (const q of exam.questions) ALL.push(q)
}

// ---------------------------------------------------------------------------
// 2. Feasibility helpers.
// ---------------------------------------------------------------------------
const isImageGrid = q =>
  q.options.some(o => o.trim().startsWith('گزینه')) ||        // placeholder "compare 4 images" options
  (q.image && /چهار گزینه/.test(q.image.alt || ''))           // alt says "four image choices"

const answerOf = q => q.options[q.correctAnswerIndex]
const tLen = q => (q.text || '').length
const eLen = q => (q.explanation || '').length

// A question is "video-friendly" when it is short, has a real explanation, a
// clear single correct answer, and does NOT depend on comparing tiny images.
const friendly = (q, maxText, maxExpl) =>
  tLen(q) > 0 && tLen(q) <= maxText &&
  eLen(q) >= 20 && eLen(q) <= maxExpl &&
  answerOf(q) && !answerOf(q).trim().startsWith('گزینه') &&
  !isImageGrid(q)

// Explicit blocklist — question ids that must never appear in this batch.
// se-16-27: a right-of-way DIAGRAM (not a single sign; answer "خودروی ۱" is
//           meaningless without the picture). Replaced by a clean single sign.
// se-03-29: a long, definitional first-aid question (four near-identical
//           paragraph options). Replaced by a short, clear first-aid question.
const BLOCKLIST = new Set(['se-16-27', 'se-03-29'])
const allowed = q => !BLOCKLIST.has(q.id)

// Pools -----------------------------------------------------------------------
// Signs: keep ONLY single, clear sign illustrations — a real image, a real text
// answer, not a 4-image grid, AND the prompt must be about a تابلو (sign). The
// تابلو requirement excludes right-of-way/scene diagrams that merely carry an
// image, so replacements stay recognizable single signs.
const signsPool = ALL.filter(q => q.category === 'signs' && q.image && allowed(q) && friendly(q, 80, 200) && /تابلو/.test(q.text))
// Text-only pools for variety (no image dependency at all).
const rulesPool   = ALL.filter(q => q.category === 'rules'   && !q.image && allowed(q) && friendly(q, 120, 210))
const vehiclePool = ALL.filter(q => q.category === 'vehicle' && !q.image && allowed(q) && friendly(q, 120, 210))
const careePool   = ALL.filter(q => (q.category === 'safety' || q.category === 'firstaid') && !q.image && allowed(q) && friendly(q, 120, 210))

// ---------------------------------------------------------------------------
// 3. Deterministic, diversity-aware pick.
//    Sort by "cleanliness" (shorter text + explanation first), then spread
//    across source exams with a per-exam cap so no single exam dominates.
// ---------------------------------------------------------------------------
const byClean = (a, b) => (tLen(a) + eLen(a)) - (tLen(b) + eLen(b)) || a.id.localeCompare(b.id)

function pick(pool, count, cap = 1) {
  const sorted = [...pool].sort(byClean)
  const perExam = new Map()
  const chosen = []
  for (let c = cap; chosen.length < count && c <= 4; c++) {
    for (const q of sorted) {
      if (chosen.includes(q)) continue
      const used = perExam.get(q.examNo) || 0
      if (used >= c) continue
      perExam.set(q.examNo, used + 1)
      chosen.push(q)
      if (chosen.length >= count) break
    }
  }
  return chosen
}

// Signs-heavy mix (30 total).
const selSigns   = pick(signsPool, 14)
const selRules   = pick(rulesPool, 10)
const selVehicle = pick(vehiclePool, 4)
const selCare    = pick(careePool, 2)

// Interleave the four topic lists so the posting schedule stays varied.
function interleave(lists) {
  const out = []
  const max = Math.max(...lists.map(l => l.length))
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i])
  return out
}
const selection = interleave([selSigns, selRules, selVehicle, selCare])

// ---------------------------------------------------------------------------
// 4. Editable marketing defaults (seeded — meant to be reviewed/edited by hand).
//    Question / answer / explanation are copied verbatim from app data so the
//    batch only ever promotes REAL existing questions.
// ---------------------------------------------------------------------------
const HOOKS = {
  signs:    'این تابلو رو می‌شناسی؟ 🚦',
  rules:    'جوابش رو بلدی؟ 🤔',
  vehicle:  'درباره‌ی خودروت چقدر می‌دونی؟ 🔧',
  safety:   'این نکته‌ی ایمنی رو بلدی؟ ⚠️',
  firstaid: 'تو این موقعیت چیکار می‌کنی؟ 🚑',
}
// Safe PWA/web CTA — links to the site only, no app-store store-front wording. Product name spelled رانندگی‌یار.
const CTA = 'تمرین رایگان آیین‌نامه در رانندگی‌یار:\nranandegiyar.info'
const BASE_TAGS = ['#آیین_نامه', '#گواهینامه', '#رانندگی‌یار', '#آموزش_رانندگی']
const EXTRA_TAGS = {
  signs:    ['#تابلو_رانندگی'],
  rules:    ['#قوانین_رانندگی'],
  vehicle:  ['#فنی_خودرو'],
  safety:   ['#ایمنی_رانندگی'],
  firstaid: ['#کمک_های_اولیه'],
}

const records = selection.map((q, i) => {
  const hook = HOOKS[q.category] || HOOKS.rules
  const answer = answerOf(q)
  const hashtags = [...BASE_TAGS, ...(EXTRA_TAGS[q.category] || [])]
  const caption = `${hook}\n\n${q.text}\n\n✅ پاسخ: ${answer}\n\n${CTA}\n${hashtags.join(' ')}`
  return {
    video_id: `sb01-${String(i + 1).padStart(3, '0')}`,
    question_id: q.id,
    source_exam: q.examNo,
    category: q.category,
    hook,
    question: q.text,
    correct_answer: answer,
    short_explanation: q.explanation || '',
    screenshot_unanswered: `screenshots/${q.id}_unanswered.png`,
    screenshot_revealed:   `screenshots/${q.id}_revealed.png`,
    cta: CTA,
    caption,
    hashtags,
  }
})

// ---------------------------------------------------------------------------
// 5. Write artifacts.
// ---------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true })

const manifest = {
  batch: 'social-batch-01',
  generated_at: new Date().toISOString(),
  strategy: 'signs-heavy, visually-friendly: single-image signs + short text-only rules/vehicle/safety/firstaid; excludes 4-image-grid, long text, and long explanations.',
  source: 'src/data/source-exams/exams/*.ts (real authored questions only)',
  screenshots_generated: false,
  mix: {
    total: records.length,
    signs: selSigns.length,
    rules: selRules.length,
    vehicle: selVehicle.length,
    safety_firstaid: selCare.length,
  },
  videos: records,
}
writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')

// CSV — quote every field, double internal quotes, flatten newlines for portability.
const COLS = [
  'video_id', 'question_id', 'source_exam', 'category', 'hook', 'question',
  'correct_answer', 'short_explanation', 'screenshot_unanswered',
  'screenshot_revealed', 'cta', 'caption', 'hashtags',
]
const csvCell = v => {
  const s = Array.isArray(v) ? v.join(' ') : String(v ?? '')
  return '"' + s.replace(/\r?\n/g, ' | ').replace(/"/g, '""') + '"'
}
const csv = [COLS.join(',')]
  .concat(records.map(r => COLS.map(c => csvCell(r[c])).join(',')))
  .join('\r\n') + '\r\n'
writeFileSync(join(OUT_DIR, 'metadata.csv'), '﻿' + csv, 'utf8')  // BOM so Excel reads UTF-8/RTL

// Console summary.
console.log(`Selected ${records.length} questions:`)
console.log(`  signs=${selSigns.length} rules=${selRules.length} vehicle=${selVehicle.length} safety/firstaid=${selCare.length}`)
console.log(`  exams covered: ${[...new Set(records.map(r => r.source_exam))].sort((a, b) => a - b).join(', ')}`)
console.log(`Wrote:\n  ${join(OUT_DIR, 'manifest.json')}\n  ${join(OUT_DIR, 'metadata.csv')}`)
