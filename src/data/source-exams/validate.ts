// Phase 4C — Pure validation for authored source-exam data.
//
// Data-only checks (no file I/O). Image-file existence is enforced separately by
// Vite's glob at build time; this validator never throws and returns a structured
// list of errors + warnings so it can run in-app, in tests, and in a CI script.

import type { SourceExamData, SourceQuestion } from './types'
import { SOURCE_CATEGORY_IDS } from './types'

export const EXPECTED_EXAM_COUNT = 17
export const QUESTIONS_PER_EXAM = 30
export const OPTIONS_PER_QUESTION = 4

export interface ValidationIssue {
  level: 'error' | 'warning'
  code: string
  message: string
  examNo?: number
  questionId?: string
}

export interface ValidationResult {
  ok: boolean              // true when there are no errors (warnings are allowed)
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

export interface ValidateOptions {
  /** Require the full, final dataset: exactly 17 exams covering 1..17.
   *  Off by default so partial datasets (and Phase 4C's empty array) pass. */
  strict?: boolean
}

const isNonEmpty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0

/**
 * Validate authored source-exam data. Each present exam is fully checked
 * regardless of `strict`; `strict` additionally requires the complete 1..17 set.
 */
export function validateSourceExams(
  data: SourceExamData[],
  options: ValidateOptions = {},
): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const err = (code: string, message: string, examNo?: number, questionId?: string) =>
    errors.push({ level: 'error', code, message, examNo, questionId })
  const warn = (code: string, message: string, examNo?: number, questionId?: string) =>
    warnings.push({ level: 'warning', code, message, examNo, questionId })

  // ── Exam-set level ──────────────────────────────────────────────
  const seenExamNos = new Set<number>()
  for (const exam of data) {
    if (!Number.isInteger(exam.examNo) || exam.examNo < 1 || exam.examNo > EXPECTED_EXAM_COUNT) {
      err('EXAM_NO_RANGE', `examNo باید بین ۱ تا ${EXPECTED_EXAM_COUNT} باشد (مقدار: ${exam.examNo}).`, exam.examNo)
    }
    if (seenExamNos.has(exam.examNo)) {
      err('EXAM_NO_DUP', `شمارهٔ آزمون تکراری است: ${exam.examNo}.`, exam.examNo)
    }
    seenExamNos.add(exam.examNo)
  }

  if (options.strict) {
    if (data.length !== EXPECTED_EXAM_COUNT) {
      err('EXAM_COUNT', `در حالت سخت‌گیرانه باید دقیقاً ${EXPECTED_EXAM_COUNT} آزمون وجود داشته باشد (تعداد فعلی: ${data.length}).`)
    }
    for (let n = 1; n <= EXPECTED_EXAM_COUNT; n++) {
      if (!seenExamNos.has(n)) err('EXAM_MISSING', `آزمون ${n} موجود نیست.`, n)
    }
  }

  // ── Question level (every present exam is fully checked) ─────────
  const seenIds = new Set<string>()

  for (const exam of data) {
    const qs = exam.questions ?? []

    if (qs.length !== QUESTIONS_PER_EXAM) {
      err('QUESTION_COUNT', `آزمون ${exam.examNo} باید دقیقاً ${QUESTIONS_PER_EXAM} سؤال داشته باشد (تعداد: ${qs.length}).`, exam.examNo)
    }

    const seenOrders = new Set<number>()
    for (const q of qs) {
      validateQuestion(q, exam.examNo, { err, warn })

      // order unique within exam, range 1..30
      if (!Number.isInteger(q.order) || q.order < 1 || q.order > QUESTIONS_PER_EXAM) {
        err('ORDER_RANGE', `ترتیب سؤال باید بین ۱ تا ${QUESTIONS_PER_EXAM} باشد (مقدار: ${q.order}).`, exam.examNo, q.id)
      }
      if (seenOrders.has(q.order)) {
        err('ORDER_DUP', `ترتیب سؤال تکراری در آزمون ${exam.examNo}: ${q.order}.`, exam.examNo, q.id)
      }
      seenOrders.add(q.order)

      // examNo on the question must match its container
      if (q.examNo !== exam.examNo) {
        err('EXAM_NO_MISMATCH', `examNo سؤال (${q.examNo}) با آزمون دربرگیرنده (${exam.examNo}) همخوانی ندارد.`, exam.examNo, q.id)
      }

      // globally unique id
      if (seenIds.has(q.id)) {
        err('ID_DUP', `شناسهٔ سؤال تکراری است: ${q.id}.`, exam.examNo, q.id)
      }
      seenIds.add(q.id)
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}

function validateQuestion(
  q: SourceQuestion,
  examNo: number,
  sink: {
    err: (code: string, message: string, examNo?: number, questionId?: string) => void
    warn: (code: string, message: string, examNo?: number, questionId?: string) => void
  },
) {
  const { err, warn } = sink

  if (!isNonEmpty(q.id)) err('ID_EMPTY', 'شناسهٔ سؤال نباید خالی باشد.', examNo, q.id)
  if (!isNonEmpty(q.text)) err('TEXT_EMPTY', 'متن سؤال نباید خالی باشد.', examNo, q.id)

  // exactly 4 non-empty options
  if (!Array.isArray(q.options) || q.options.length !== OPTIONS_PER_QUESTION) {
    err('OPTIONS_COUNT', `هر سؤال باید دقیقاً ${OPTIONS_PER_QUESTION} گزینه داشته باشد.`, examNo, q.id)
  } else if (q.options.some(o => !isNonEmpty(o))) {
    err('OPTION_EMPTY', 'هیچ گزینه‌ای نباید خالی باشد.', examNo, q.id)
  }

  // correctAnswerIndex in 0..3
  if (!Number.isInteger(q.correctAnswerIndex) || q.correctAnswerIndex < 0 || q.correctAnswerIndex > OPTIONS_PER_QUESTION - 1) {
    err('ANSWER_INDEX', `correctAnswerIndex باید بین ۰ تا ${OPTIONS_PER_QUESTION - 1} باشد (مقدار: ${q.correctAnswerIndex}).`, examNo, q.id)
  }

  // valid category
  if (!SOURCE_CATEGORY_IDS.includes(q.category)) {
    err('CATEGORY_INVALID', `دستهٔ نامعتبر: ${q.category}.`, examNo, q.id)
  }

  // required source
  if (!isNonEmpty(q.source)) err('SOURCE_REQUIRED', 'فیلد source الزامی و نباید خالی باشد.', examNo, q.id)

  // image questions require alt text when an image object exists
  if (q.image) {
    if (!isNonEmpty(q.image.path)) err('IMAGE_PATH_EMPTY', 'مسیر تصویر نباید خالی باشد.', examNo, q.id)
    if (!isNonEmpty(q.image.alt)) err('IMAGE_ALT_REQUIRED', 'سؤال تصویری باید متن جایگزین (alt) داشته باشد.', examNo, q.id)
  }

  // imagePending is allowed — surfaced as a warning, not an error
  if (q.imagePending && !q.image) {
    warn('IMAGE_PENDING', 'سؤال به‌عنوان تصویری علامت خورده ولی تصویر هنوز اضافه نشده است.', examNo, q.id)
  }
}
