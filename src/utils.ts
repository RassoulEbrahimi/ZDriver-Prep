import type { Question, Progress } from './types'

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export function fa(n: number | string): string {
  return String(n).replace(/\d/g, d => FA_DIGITS[Number(d)])
}

export function formatTime(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${fa(mm)}:${fa(ss)}`
}

export const MAX_EXAM_SIZE = 30
const OFFICIAL_TOTAL = 30
const OFFICIAL_PASS  = 26

/** Exam length = whole pool when small, capped at the official 30. */
export function examLength(poolSize: number): number {
  return Math.min(MAX_EXAM_SIZE, poolSize)
}

/** Pass mark scaled to the official 26/30 ratio. total=30 → 26; total=10 → 9. */
export function passThreshold(total: number): number {
  return Math.ceil(total * OFFICIAL_PASS / OFFICIAL_TOTAL)
}

/**
 * Returns a new Question with its options shuffled and `answer` remapped to the
 * correct option's new position. Correctness is tracked by the original option
 * index (never by text), so duplicate option text is handled safely. The input
 * question and its arrays are never mutated; all other fields are preserved.
 */
export function shuffleQuestionOptions(question: Question): Question {
  // Fisher–Yates over the original indices, so we can remap `answer` by position.
  const order = question.options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }

  return {
    ...question,
    options: order.map(i => question.options[i]),
    answer: order.indexOf(question.answer),
  }
}

const PROGRESS_KEY = 'zdriver:progress:v1'

/**
 * Reads persisted progress from localStorage, falling back safely on any
 * problem (storage unavailable, corrupt/invalid JSON). Parsed data is merged
 * over `fallback` so missing/future fields keep safe defaults, and the
 * `bookmarked` / `wrongQuestionIds` arrays are validated. Never throws.
 */
export function loadProgress(fallback: Progress): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return fallback
    return {
      ...fallback,
      ...parsed,
      // Always reflect the current question bank, not a stale stored count.
      totalQuestions:   fallback.totalQuestions,
      bookmarked:       Array.isArray(parsed.bookmarked)       ? parsed.bookmarked       : [],
      wrongQuestionIds: Array.isArray(parsed.wrongQuestionIds) ? parsed.wrongQuestionIds : [],
    }
  } catch {
    return fallback
  }
}

/** Persists the full progress object to localStorage. Never throws. */
export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    /* storage unavailable or quota exceeded — ignore, persistence is best-effort */
  }
}
