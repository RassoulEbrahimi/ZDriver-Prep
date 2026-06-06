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
import { exam01 } from './exams/exam-01'
import { exam02 } from './exams/exam-02'
import { exam03 } from './exams/exam-03'
import { exam04 } from './exams/exam-04'
import { exam05 } from './exams/exam-05'
import { exam06 } from './exams/exam-06'
import { exam07 } from './exams/exam-07'
import { exam08 } from './exams/exam-08'
import { exam09 } from './exams/exam-09'
import { exam10 } from './exams/exam-10'
import { exam11 } from './exams/exam-11'
import { exam12 } from './exams/exam-12'
import { exam13 } from './exams/exam-13'
import { exam14 } from './exams/exam-14'
import { exam15 } from './exams/exam-15'

/**
 * Real source exams imported from aeinname_asli.pdf.
 * Exam 1 ships with images; Exams 2–15 are text/options/answers only (image-dependent
 * questions are staged as imagePending until a later image phase). Exams 16–17 are not
 * present here yet (different page layout/encoding) and fall back to the placeholder
 * builder via `loadSourceExamQuestions`. Append exam-NN modules here as they are imported.
 */
export const SOURCE_EXAMS_DATA: SourceExamData[] = [
  exam01, exam02, exam03, exam04, exam05, exam06, exam07, exam08,
  exam09, exam10, exam11, exam12, exam13, exam14, exam15,
]

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
