export interface Question {
  id: string
  cat: string
  text: string
  options: string[]
  answer: number
  explanation: string
  image?: string          // optional per-question illustration URL or asset path
  source?: string         // e.g. 'driveing.ir', 'aiinname-pdf-2024'
  difficulty?: 1 | 2 | 3 // 1 = easy, 2 = medium, 3 = hard
}

export interface Category {
  id: string
  title: string
  subtitle: string
  emoji: string
  total: number
  done: number
  color: string
}

export interface Progress {
  totalQuestions: number
  answered: number
  correct: number
  wrong: number
  streakDays: number
  daysToExam: number
  examReadiness: number
  bookmarked: string[]
  wrongQuestionIds: string[]
}

export interface ExamResult {
  answers: (number | null)[]
  exam: Question[]
  correct: number
  total: number
  timeUsed: number
}

export interface SourceExam {
  id: number              // 1..17
  questionCount: number   // 30
  durationMinutes: number // 20
  status: 'not-started'   // Phase 4A only; widen (e.g. 'in-progress' | 'passed') later
}

/** A question inside a source exam. Extends Question with an image-dependent flag
 *  so the UI can show an image placeholder (real images arrive in Phase 4C/4D). */
export interface SourceExamQuestion extends Question {
  hasImage: boolean
}

export interface SourceExamResult {
  examNo: number
  exam: SourceExamQuestion[]
  answers: (number | null)[]
  correct: number
  total: number
  timeUsed: number
}

/** Sub-state machine for the dedicated source-exam flow (independent of ExamState). */
export type SourceView = 'catalog' | 'start' | 'active' | 'result'

/** Sub-state machine for the exam-based Practice flow (تمرین tab): pick an exam, then run it. */
export type PracticeView = 'catalog' | 'active'

/** Distinguishes the 17 official آیین‌نامه exams from the supplementary review exam (18). */
export type ExamKind = 'official' | 'supplementary'

/** Display + sizing metadata for one exam in the unified 1..18 catalog.
 *  Metadata only — question content is resolved separately (see data/examRegistry). */
export interface ExamMeta {
  id: number              // 1..18
  kind: ExamKind          // 'official' for 1..17, 'supplementary' for 18
  official: boolean        // convenience mirror of (kind === 'official')
  title: string           // e.g. 'آزمون ۱'  |  'آزمون ۱۸ — مرور تکمیلی'
  questionCount: number   // 30 for 1..17; QUESTIONS.length for 18
  durationMinutes: number // 20 for 1..17; 20 for 18
  passThreshold: number   // 26 for 1..17; derived for 18
}

export type TabId = 'home' | 'practice' | 'exam' | 'mistakes' | 'progress' | 'source'
export type ExamState = 'idle' | 'active' | 'result'
export type SignKind = 'stop' | 'warn' | 'mandatory' | 'speed'
