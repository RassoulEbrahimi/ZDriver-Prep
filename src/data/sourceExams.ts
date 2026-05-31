import type { SourceExam } from '../types'

/** Number of official source-based exams (آزمون‌های آیین‌نامه). */
export const SOURCE_EXAM_COUNT = 17

/**
 * Placeholder descriptors for the 17 official source exams (Phase 4A — UI shell only).
 * Real question content from aeinname_asli.pdf is NOT imported yet; each exam is a
 * fixed 30-question / 20-minute slot that has not been started.
 */
export const SOURCE_EXAMS: SourceExam[] = Array.from(
  { length: SOURCE_EXAM_COUNT },
  (_, i): SourceExam => ({
    id: i + 1,
    questionCount: 30,
    durationMinutes: 20,
    status: 'not-started',
  }),
)
