// Phase 5B-0 — Unified exam registry (exams 1..18), data scaffolding only.
//
// A single, tree-shakable metadata surface spanning the 17 official آیین‌نامه
// exams plus the supplementary review exam (18). Nothing renders this yet; it is
// safe if unused. It re-exposes the existing 1..17 question loader unchanged and
// resolves Exam 18 from the generic bank — without touching SOURCE_EXAMS_DATA,
// the source-exam validator, screens, routing, or persistence.

import type { ExamMeta, Question, SourceExamQuestion } from '../types'
import { fa } from '../utils'
import { SOURCE_EXAM_COUNT } from './sourceExams'
import { SOURCE_EXAM_SIZE, SOURCE_EXAM_PASS } from './sourceExamBuilder'
import { loadSourceExamQuestions } from './source-exams'
import {
  EXAM_18_ID, EXAM_18_TITLE, EXAM_18_COUNT, EXAM_18_PASS,
  EXAM_18_DURATION_MIN, buildExam18Questions,
} from './exam18'

const OFFICIAL_DURATION_MIN = 20

/** Metadata for the 17 official source exams — derived from existing constants
 *  (no magic numbers re-typed, so it tracks the source-exam config). */
const officialEntries: ExamMeta[] = Array.from(
  { length: SOURCE_EXAM_COUNT },
  (_, i): ExamMeta => ({
    id: i + 1,
    kind: 'official',
    official: true,
    title: `آزمون ${fa(i + 1)}`,
    questionCount: SOURCE_EXAM_SIZE, // 30
    durationMinutes: OFFICIAL_DURATION_MIN,
    passThreshold: SOURCE_EXAM_PASS, // 26
  }),
)

/** Metadata for the supplementary, non-official review exam (18). */
const exam18Entry: ExamMeta = {
  id: EXAM_18_ID,
  kind: 'supplementary',
  official: false,
  title: EXAM_18_TITLE,
  questionCount: EXAM_18_COUNT,
  durationMinutes: EXAM_18_DURATION_MIN,
  passThreshold: EXAM_18_PASS,
}

/** Unified catalog: 17 official exams followed by Exam 18 (مرور تکمیلی). */
export const EXAM_REGISTRY: ExamMeta[] = [...officialEntries, exam18Entry]

/** Look up exam metadata by id (1..18), or undefined if unknown. */
export function getExamMeta(id: number): ExamMeta | undefined {
  return EXAM_REGISTRY.find(e => e.id === id)
}

/**
 * Resolve runtime questions for any exam id.
 *  - 1..17 → existing source-exam loader (real data with placeholder fallback),
 *    completely unchanged.
 *  - 18    → generic-bank adapter.
 * Not yet called by any screen (Phase 5B-0 scaffolding).
 */
export function loadExamQuestions(id: number, fallbackPool: Question[]): SourceExamQuestion[] {
  if (id === EXAM_18_ID) return buildExam18Questions()
  return loadSourceExamQuestions(id, fallbackPool)
}
