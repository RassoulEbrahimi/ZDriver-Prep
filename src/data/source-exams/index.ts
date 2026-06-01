// Phase 4C — Source-exam data surface.
//
// Single import point for real source-exam data. In Phase 4C the dataset is empty,
// so `loadSourceExamQuestions` always falls back to the live placeholder builder.
// Phase 4D will (a) populate SOURCE_EXAMS_DATA from per-exam files under ./exams/
// and (b) swap the SourceExamQuestionScreen call-site to use this loader.

import type { Question, SourceExamQuestion } from '../../types'
import type { SourceExamData } from './types'
import { toSourceExamQuestion } from './adapter'
import { buildSourceExam } from '../sourceExamBuilder'

/**
 * Real source exams. EMPTY in Phase 4C — no PDF/real data imported yet.
 * Phase 4D will append per-exam modules from ./exams/exam-NN.ts here.
 */
export const SOURCE_EXAMS_DATA: SourceExamData[] = []

/** Look up a real source exam by number (1..17), or undefined if not yet authored. */
export function getSourceExam(examNo: number): SourceExamData | undefined {
  return SOURCE_EXAMS_DATA.find(e => e.examNo === examNo)
}

/**
 * Return the runtime questions for a source exam.
 *
 * If real, populated data exists for `examNo` it is adapted to the runtime shape;
 * otherwise this falls back to the temporary placeholder builder (current Phase 4B
 * behavior). Drop-in replacement for `buildSourceExam(examNo, pool)` — Phase 4D
 * will switch the screen call-site here without any UI change.
 */
export function loadSourceExamQuestions(examNo: number, fallbackPool: Question[]): SourceExamQuestion[] {
  const exam = getSourceExam(examNo)
  if (exam && exam.questions.length > 0) {
    return exam.questions.map(toSourceExamQuestion)
  }
  return buildSourceExam(examNo, fallbackPool)
}
