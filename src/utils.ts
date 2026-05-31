import type { Question } from './types'

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export function fa(n: number | string): string {
  return String(n).replace(/\d/g, d => FA_DIGITS[Number(d)])
}

export function formatTime(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${fa(mm)}:${fa(ss)}`
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
