import React from 'react'
import type { Question, SignKind } from '../types'
import { BookmarkIcon, BookmarkFilledIcon, CheckIcon, CloseIcon, BulbIcon, StopSign, WarnSign, MandatorySign, SpeedSign } from './Icons'

interface Props {
  question: Question & { catLabel?: string }
  selected: number | null
  onSelect: (i: number) => void
  submitted: boolean
  showExplanation?: boolean
  bookmarked?: boolean
  onBookmark?: () => void
  signKind?: SignKind | null
  signN?: string
}

const OPT_LETTERS = ['الف', 'ب', 'ج', 'د']

export function QuestionCard({
  question, selected, onSelect, submitted,
  showExplanation = true, bookmarked = false, onBookmark,
  signKind, signN = '۵۰',
}: Props) {
  const correctIdx = question.answer
  const isCorrect = submitted && selected === correctIdx

  function optClass(i: number): string {
    if (submitted) {
      if (i === correctIdx) return 'zd-option is-correct'
      if (i === selected)   return 'zd-option is-wrong'
    } else if (i === selected) {
      return 'zd-option is-selected'
    }
    return 'zd-option'
  }

  return (
    <div className="zd-card zd-fade-up" style={{ padding: 20 }}>
      {/* Header row */}
      <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
        <span className="zd-chip">
          <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--primary)', display: 'inline-block' }} />
          {question.catLabel ?? 'تمرین'}
        </span>
        {onBookmark && (
          <button onClick={onBookmark} aria-label="نشان‌گذاری" style={{
            background: bookmarked ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'transparent',
            border: 'none', cursor: 'pointer',
            width: 36, height: 36, borderRadius: 12,
            display: 'grid', placeItems: 'center',
            color: bookmarked ? 'var(--accent-deep)' : 'var(--ink-3)',
          }}>
            {bookmarked ? <BookmarkFilledIcon size={20} /> : <BookmarkIcon size={20} />}
          </button>
        )}
      </div>

      {/* Road sign illustration */}
      {signKind && (
        <div style={{
          background: 'var(--bg-deeper)', borderRadius: 16, padding: 18,
          display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
        }}>
          {signKind === 'stop'      && <StopSign size={88} />}
          {signKind === 'warn'      && <WarnSign size={88} />}
          {signKind === 'mandatory' && <MandatorySign size={88} />}
          {signKind === 'speed'     && <SpeedSign size={88} n={signN} />}
        </div>
      )}

      {/* Question text */}
      <div style={{ fontSize: 17, lineHeight: 1.65, fontWeight: 600, color: 'var(--ink)' }}>
        {question.text}
      </div>

      {/* Options */}
      <div className="flex flex-col" style={{ gap: 10, marginTop: 18 }}>
        {question.options.map((opt, i) => (
          <button key={i} className={optClass(i)} onClick={() => !submitted && onSelect(i)}>
            <div className="zd-opt-letter">{OPT_LETTERS[i]}</div>
            <div className="zd-opt-text">{opt}</div>
            <div className="zd-opt-mark">
              {submitted && i === correctIdx && <CheckIcon size={22} color="var(--success)" stroke={2.4} />}
              {submitted && i === selected && i !== correctIdx && <CloseIcon size={22} color="var(--danger)" stroke={2.4} />}
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {submitted && showExplanation && (
        <div className="zd-fade-up" style={{
          marginTop: 16, padding: 14,
          background: isCorrect ? 'var(--success-soft)' : 'var(--primary-soft)',
          borderRadius: 14,
          border: `1px solid ${isCorrect
            ? 'color-mix(in oklab, var(--success) 30%, transparent)'
            : 'color-mix(in oklab, var(--primary) 20%, transparent)'}`,
        }}>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: isCorrect ? 'var(--success)' : 'var(--primary)',
              color: '#fff', display: 'grid', placeItems: 'center',
            }}>
              {isCorrect
                ? <CheckIcon size={16} stroke={2.6} />
                : <BulbIcon  size={16} stroke={2} />}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: isCorrect ? 'var(--success)' : 'var(--primary-ink)' }}>
              {isCorrect ? 'پاسخ درست' : 'توضیح'}
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>
            {question.explanation}
          </div>
        </div>
      )}
    </div>
  )
}
