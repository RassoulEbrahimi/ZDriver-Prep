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

export type TabId = 'home' | 'practice' | 'exam' | 'mistakes' | 'progress'
export type ExamState = 'idle' | 'active' | 'result'
export type SignKind = 'stop' | 'warn' | 'mandatory' | 'speed'
