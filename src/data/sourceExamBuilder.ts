import type { Question, SourceExamQuestion } from '../types'

/**
 * ⚠️ TEMPORARY PLACEHOLDER DATA — Phase 4B only.
 *
 * The official source exams (آزمون‌های آیین‌نامه) will be populated from the
 * real aeinname_asli.pdf question bank in Phase 4C/4D. Until then, this module
 * synthesizes each exam deterministically from the EXISTING practice pool so the
 * full source-exam flow (start → questions → result) is functional end-to-end.
 *
 * This is NOT real source-exam content. Because the practice pool is smaller than
 * 30, a single exam intentionally repeats questions to fill the fixed 30 slots.
 * Replace `buildSourceExam` with a real per-exam loader in Phase 4C/4D.
 */

/** Official source-exam constants (fixed; do NOT route through utils.passThreshold). */
export const SOURCE_EXAM_SIZE = 30
export const SOURCE_EXAM_PASS = 26          // قبولی: ۲۶ از ۳۰
export const SOURCE_EXAM_DURATION = 20 * 60 // 20 minutes, in seconds

/**
 * Build a fixed 30-question set for a given source exam number (1..17).
 * Deterministic: the same examNo always yields the same set, and different
 * exam numbers start at different offsets so the catalog feels distinct.
 *
 * Image support: a question is flagged `hasImage` when it carries a real
 * `image` asset, OR (for placeholder demo only) by a deterministic rule so the
 * image-placeholder UI is exercisable before real image questions exist.
 */
export function buildSourceExam(examNo: number, pool: Question[]): SourceExamQuestion[] {
  const offset = (examNo - 1) * 7
  return Array.from({ length: SOURCE_EXAM_SIZE }, (_, i): SourceExamQuestion => {
    const q = pool[(offset + i) % pool.length]
    // Real image wins; otherwise a placeholder-demo flag (removed in Phase 4C/4D).
    const hasImage = Boolean(q.image) || q.cat === 'signs' || i % 5 === 2
    return { ...q, hasImage }
  })
}
