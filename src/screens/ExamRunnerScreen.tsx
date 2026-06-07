import React, { useState, useEffect, useMemo } from 'react'
import type { Question, Category, SourceExamResult } from '../types'
import { CloseIcon, FlagIcon, ClockIcon, ImageIcon, ChevRightIcon, ChevLeftIcon, ShieldIcon } from '../components/Icons'
import { QuestionImagePlaceholder } from '../components/QuestionImagePlaceholder'
import { fa, formatTime } from '../utils'
import { getExamMeta, loadExamQuestions } from '../data/examRegistry'

interface Props {
  examId: number
  /** Fallback pool for source exams without real data yet (placeholder builder). */
  fallbackPool: Question[]
  categories: Category[]
  onFinish: (result: SourceExamResult) => void
  onExit: () => void
}

const OPT_LETTERS = ['الف', 'ب', 'ج', 'د']

/**
 * Timed exam runner (آزمون). Simulation mode: countdown timer, NO instant answer
 * reveal — selecting only marks the choice; correctness is shown only on the final
 * result screen. Image-dependent questions reuse the shared QuestionImagePlaceholder
 * (real image for Exam 1, striped placeholder for imagePending). Sized per-exam from
 * the loaded question set, so Exam 18 runs QUESTIONS.length items (not a fixed 30).
 */
export function ExamRunnerScreen({ examId, fallbackPool, categories, onFinish, onExit }: Props) {
  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const meta = getExamMeta(examId)
  // 1..17 → source loader (real data + placeholder fallback); 18 → generic bank.
  const exam = useMemo(() => loadExamQuestions(examId, fallbackPool), [examId, fallbackPool])
  const total = exam.length
  const duration = (meta?.durationMinutes ?? 20) * 60
  const official = meta?.official ?? true
  const title = meta?.title ?? `آزمون ${fa(examId)}`

  const [idx,      setIdx]      = useState(0)
  const [answers,  setAnswers]  = useState<(number | null)[]>(() => Array(total).fill(null))
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(duration)

  // Timer — auto-submits when it reaches zero.
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); finish(answers); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore selection when navigating between questions.
  useEffect(() => { setSelected(answers[idx]) }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const q   = exam[idx]
  const cat = q ? catMap[q.cat] : undefined
  const isLast = idx === total - 1
  const lowTime = timeLeft < 60

  function commit(): (number | null)[] {
    const updated = [...answers]
    updated[idx] = selected
    setAnswers(updated)
    return updated
  }

  function finish(currentAnswers: (number | null)[]) {
    const updated = [...currentAnswers]
    updated[idx] = selected
    const correct = updated.filter((a, i) => a === exam[i].answer).length
    onFinish({
      examNo: examId, exam, answers: updated, correct,
      total, timeUsed: duration - timeLeft,
    })
  }

  function handleNext() {
    const updated = commit()
    if (isLast) finish(updated)
    else setIdx(i => i + 1)
  }

  function handlePrev() {
    if (idx === 0) return
    commit()
    setIdx(i => i - 1)
  }

  return (
    <div className="zd-scroll" style={{ background: 'var(--bg-deeper)', paddingBottom: 24 }}>
      {/* Header */}
      <div style={{
        padding: '54px 20px 16px',
        background: 'linear-gradient(180deg, var(--card) 0%, var(--bg-deeper) 100%)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onExit} aria-label="خروج"><CloseIcon size={18} /></button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12,
            background: lowTime ? 'var(--danger-soft)' : 'var(--primary-soft)',
            color: lowTime ? 'var(--danger)' : 'var(--primary-ink)', fontWeight: 700,
          }}>
            <ClockIcon size={16} stroke={2.2} />
            <span className="zd-num" style={{ fontSize: 15, letterSpacing: 0.5 }}>{formatTime(timeLeft)}</span>
          </div>
          <button className="zd-icon-btn" onClick={() => finish(answers)} aria-label="پایان"><FlagIcon size={18} /></button>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div>
              <div className="zd-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {official
                  ? (<><ShieldIcon size={12} stroke={2} /> آزمون رسمی آیین‌نامه</>)
                  : 'مرور تکمیلی · غیررسمی'}
              </div>
              <div className="zd-num" style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: 'var(--ink)' }}>
                {title} <span style={{ color: 'var(--ink-3)', fontWeight: 600, fontSize: 16 }}>· سؤال {fa(idx + 1)} از {fa(total)}</span>
              </div>
            </div>
          </div>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: total }).map((_, i) => {
              const answered = answers[i] !== null && i !== idx
              const current  = i === idx
              return (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 999,
                  background: current ? 'var(--primary)' : answered ? 'var(--primary-soft)' : 'var(--line)',
                  border: answered && !current ? '1px solid color-mix(in oklab, var(--primary) 35%, transparent)' : 'none',
                  transition: 'background .2s',
                }} />
              )
            })}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div style={{ padding: 16 }}>
        <div className="zd-card zd-fade-up" key={idx} style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="zd-chip" style={{
              background: `color-mix(in oklab, ${cat?.color ?? 'var(--primary)'} 14%, transparent)`,
              color: cat?.color ?? 'var(--primary)',
            }}>
              {cat?.emoji} {cat?.title}
            </span>
            {q.hasImage && (
              <span className="zd-chip zd-chip-neutral">
                <ImageIcon size={13} stroke={2} /> سؤال تصویری
              </span>
            )}
          </div>

          {q.hasImage && <QuestionImagePlaceholder src={q.image} />}

          <div style={{ fontSize: 17, lineHeight: 1.65, fontWeight: 600, color: 'var(--ink)' }}>{q.text}</div>

          {/* Options — selection only, NO correctness reveal in exam mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {q.options.map((opt, i) => (
              <div key={i} className={`zd-option${selected === i ? ' is-selected' : ''}`} onClick={() => setSelected(i)}>
                <div className="zd-opt-letter">{OPT_LETTERS[i] ?? fa(i + 1)}</div>
                <div className="zd-opt-text">{opt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={handlePrev} disabled={idx === 0} className="zd-btn zd-btn-outline"
            style={{ flex: 1, height: 50, opacity: idx === 0 ? 0.45 : 1 }}>
            <ChevRightIcon size={18} /> قبلی
          </button>
          <button onClick={handleNext}
            className={`zd-btn ${isLast ? 'zd-btn-accent' : 'zd-btn-primary'}`}
            style={{ flex: 2, height: 50 }}>
            {isLast ? 'پایان آزمون' : 'سؤال بعدی'}
            {!isLast && <ChevLeftIcon size={18} stroke={2.4} />}
          </button>
        </div>
      </div>
    </div>
  )
}
