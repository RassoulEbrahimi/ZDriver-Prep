#!/usr/bin/env node
// Source-exam validation runner (CI / prebuild guard) — Phase 7Q-0.
//
// Loads the REAL typed dataset (src/data/source-exams/index.ts) through Vite's
// programmatic SSR module loader, so the exact objects the app bundles are what
// get validated — no parallel parser, no extra dependency (Vite is already a
// devDependency), and it works on Node 20 (local) and 22 (CI) alike.
//
// Flags:
//   --strict             enforce the full dataset (17 exams, every examNo present)
//   --lint-explanations  fail on empty `explanation` fields (off by default while
//                        the Phase 7Q content batches are still being authored)

const EXPECTED_EXAM_COUNT = 17
const QUESTIONS_PER_EXAM = 30
const OPTIONS_PER_QUESTION = 4
const VALID_CATEGORIES = ['signs', 'rules', 'safety', 'vehicle', 'firstaid']

const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0

/** Load SOURCE_EXAMS_DATA via Vite's SSR transform (handles TS + import.meta.glob). */
async function loadSourceExamsData() {
  const { createServer } = await import('vite')
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
  })
  try {
    const mod = await server.ssrLoadModule('/src/data/source-exams/index.ts')
    const data = mod.SOURCE_EXAMS_DATA
    if (!Array.isArray(data)) throw new Error('SOURCE_EXAMS_DATA is not an array')
    return data
  } finally {
    await server.close()
  }
}

function validateSourceExams(data, { strict = false } = {}) {
  const errors = []
  const warnings = []
  const err = (code, message) => errors.push({ level: 'error', code, message })
  const warn = (code, message) => warnings.push({ level: 'warning', code, message })

  const seenExamNos = new Set()
  for (const exam of data) {
    if (!Number.isInteger(exam.examNo) || exam.examNo < 1 || exam.examNo > EXPECTED_EXAM_COUNT) {
      err('EXAM_NO_RANGE', `examNo out of range 1..${EXPECTED_EXAM_COUNT}: ${exam.examNo}`)
    }
    if (seenExamNos.has(exam.examNo)) err('EXAM_NO_DUP', `duplicate examNo: ${exam.examNo}`)
    seenExamNos.add(exam.examNo)
  }

  if (strict) {
    if (data.length !== EXPECTED_EXAM_COUNT) {
      err('EXAM_COUNT', `strict: expected exactly ${EXPECTED_EXAM_COUNT} exams, got ${data.length}`)
    }
    for (let n = 1; n <= EXPECTED_EXAM_COUNT; n++) {
      if (!seenExamNos.has(n)) err('EXAM_MISSING', `missing exam ${n}`)
    }
  }

  const seenIds = new Set()
  for (const exam of data) {
    const qs = exam.questions ?? []
    if (qs.length !== QUESTIONS_PER_EXAM) {
      err('QUESTION_COUNT', `exam ${exam.examNo}: expected ${QUESTIONS_PER_EXAM} questions, got ${qs.length}`)
    }
    const seenOrders = new Set()
    for (const q of qs) {
      if (!isNonEmpty(q.id)) err('ID_EMPTY', `exam ${exam.examNo}: empty question id`)
      if (!isNonEmpty(q.text)) err('TEXT_EMPTY', `${q.id}: empty text`)
      if (!Array.isArray(q.options) || q.options.length !== OPTIONS_PER_QUESTION) {
        err('OPTIONS_COUNT', `${q.id}: expected ${OPTIONS_PER_QUESTION} options`)
      } else if (q.options.some(o => !isNonEmpty(o))) {
        err('OPTION_EMPTY', `${q.id}: empty option`)
      }
      if (!Number.isInteger(q.correctAnswerIndex) || q.correctAnswerIndex < 0 || q.correctAnswerIndex > OPTIONS_PER_QUESTION - 1) {
        err('ANSWER_INDEX', `${q.id}: correctAnswerIndex must be 0..${OPTIONS_PER_QUESTION - 1}`)
      }
      if (!VALID_CATEGORIES.includes(q.category)) err('CATEGORY_INVALID', `${q.id}: invalid category ${q.category}`)
      if (!isNonEmpty(q.source)) err('SOURCE_REQUIRED', `${q.id}: source is required`)
      if (!Number.isInteger(q.order) || q.order < 1 || q.order > QUESTIONS_PER_EXAM) {
        err('ORDER_RANGE', `${q.id}: order must be 1..${QUESTIONS_PER_EXAM}`)
      }
      if (seenOrders.has(q.order)) err('ORDER_DUP', `exam ${exam.examNo}: duplicate order ${q.order}`)
      seenOrders.add(q.order)
      if (q.examNo !== exam.examNo) err('EXAM_NO_MISMATCH', `${q.id}: examNo ${q.examNo} != container ${exam.examNo}`)
      if (seenIds.has(q.id)) err('ID_DUP', `duplicate question id: ${q.id}`)
      seenIds.add(q.id)
      if (q.image) {
        if (!isNonEmpty(q.image.path)) err('IMAGE_PATH_EMPTY', `${q.id}: empty image path`)
        if (!isNonEmpty(q.image.alt)) err('IMAGE_ALT_REQUIRED', `${q.id}: image question requires alt text`)
      }
      if (q.imagePending && !q.image) warn('IMAGE_PENDING', `${q.id}: image declared pending`)
      if (lintExplanations && !isNonEmpty(q.explanation)) {
        err('EXPLANATION_EMPTY', `${q.id}: explanation is empty`)
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}

// ── Run ──────────────────────────────────────────────────────────
const strict = process.argv.includes('--strict')
const lintExplanations = process.argv.includes('--lint-explanations')
const data = await loadSourceExamsData()
const { ok, errors, warnings } = validateSourceExams(data, { strict })

const allQuestions = data.flatMap(e => e.questions ?? [])
const explained = allQuestions.filter(q => isNonEmpty(q.explanation)).length
const pendingImages = allQuestions.filter(q => q.imagePending && !q.image).length

console.log(`▶ validate-source-exams (${strict ? 'strict' : 'non-strict'} mode${lintExplanations ? ' + explanation lint' : ''})`)
console.log(`  exams loaded: ${data.length}`)
console.log(`  questions: ${allQuestions.length} · explanations: ${explained}/${allQuestions.length} · imagePending: ${pendingImages}`)

// IMAGE_PENDING warnings are expected at scale until the image phases land —
// they are summarized in the count line above instead of printed one-by-one.
for (const w of warnings.filter(w => w.code !== 'IMAGE_PENDING')) console.warn(`  ⚠ [${w.code}] ${w.message}`)
for (const e of errors) console.error(`  ✖ [${e.code}] ${e.message}`)

if (!ok) {
  console.error(`✖ validation failed with ${errors.length} error(s).`)
  process.exit(1)
}
console.log(`✓ validation passed${warnings.length ? ` (${warnings.length} warning(s))` : ''}.`)
