// Phase 5B-0 — Exam 18 ("آزمون ۱۸ — مرور تکمیلی"), data-only module.
//
// Supplementary, NON-official review exam adapted from the existing generic
// QUESTIONS bank. It intentionally lives OUTSIDE src/data/source-exams/ and is
// NOT part of SOURCE_EXAMS_DATA, so the official 17-exam validator (which enforces
// examNo ∈ 1..17 and exactly 30 questions) is never affected.
//
// Nothing here is wired into the UI yet (Phase 5B-0 is data scaffolding only).

import type { SourceExamQuestion } from '../types'
import { QUESTIONS } from '../data'
import { passThreshold } from '../utils'

export const EXAM_18_ID = 18
export const EXAM_18_TITLE = 'آزمون ۱۸ — مرور تکمیلی'

/** Exam-18 size/scoring, derived from the generic bank (not the official 30/26). */
export const EXAM_18_COUNT = QUESTIONS.length
export const EXAM_18_PASS = passThreshold(QUESTIONS.length)
export const EXAM_18_DURATION_MIN = 20

/**
 * Exam-18 questions, adapted from the generic bank into the runtime
 * `SourceExamQuestion` shape the exam/practice runners already consume.
 *
 * Pure and deterministic. `hasImage` mirrors the official adapter's rule
 * (true only when a real image asset is present). Question ids stay as the
 * bank's original `ir-qNNN` (disjoint from official `se-NN-MM` ids).
 */
export function buildExam18Questions(): SourceExamQuestion[] {
  return QUESTIONS.map(q => ({ ...q, hasImage: Boolean(q.image) }))
}
