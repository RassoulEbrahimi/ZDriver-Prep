import React, { useState, useEffect, useMemo, useRef } from 'react'
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

  // Exit confirmation (Phase 7L-2): a خروج tap opens a sheet instead of
  // discarding the attempt immediately. The timer keeps running underneath.
  const [confirmExit, setConfirmExit] = useState(false)

  // Early-finish confirmation (M6): the پایان flag opens a sheet instead of
  // submitting immediately, so an accidental tap can't end the exam. The natural
  // last-question finish and the timer auto-submit stay direct. Timer keeps
  // running underneath; finish() is still guarded by didFinishRef.
  const [confirmFinish, setConfirmFinish] = useState(false)

  // Finish guard — the exam finalizes at most once per runner instance
  // (protects against timer-expiry racing a manual finish tap).
  const didFinishRef = useRef(false)

  // Always points at a finish closure from the LATEST render, so the mount-only
  // timer below never submits stale first-render answers/time state.
  const latestFinishRef = useRef<() => void>(() => {})
  latestFinishRef.current = () => finish(answers)

  // Timer — auto-submits when it reaches zero.
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); latestFinishRef.current(); return 0 }
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

  // Answered tally for the finish-confirm sheet: committed answers, but use the
  // live `selected` for the current question (not yet committed to `answers`).
  // Read-only — never affects scoring.
  const answeredCount = answers.filter((a, i) => (i === idx ? selected !== null : a !== null)).length
  const unansweredCount = total - answeredCount

  function commit(): (number | null)[] {
    const updated = [...answers]
    updated[idx] = selected
    setAnswers(updated)
    return updated
  }

  function finish(currentAnswers: (number | null)[]) {
    if (didFinishRef.current) return
    didFinishRef.current = true
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
    <div className="zd-scroll" style={{ background: 'var(--bg-deeper)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--zd-safe-top) 20px 16px',
        background: 'linear-gradient(180deg, var(--card) 0%, var(--bg-deeper) 100%)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={() => setConfirmExit(true)} aria-label="خروج"><CloseIcon size={18} /></button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12,
            background: lowTime ? 'var(--danger-soft)' : 'var(--primary-soft)',
            color: lowTime ? 'var(--danger)' : 'var(--ink)', fontWeight: 700,
          }}>
            <ClockIcon size={16} stroke={2.2} />
            <span className="zd-num" style={{ fontSize: 15, letterSpacing: 0.5 }}>{formatTime(timeLeft)}</span>
          </div>
          <button className="zd-icon-btn" onClick={() => setConfirmFinish(true)} aria-label="پایان"><FlagIcon size={18} /></button>
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
              <button type="button" key={i} className={`zd-option${selected === i ? ' is-selected' : ''}`} onClick={() => setSelected(i)}>
                <div className="zd-opt-letter">{OPT_LETTERS[i] ?? fa(i + 1)}</div>
                <div className="zd-opt-text">{opt}</div>
              </button>
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

      {/* Exit confirmation sheet */}
      {confirmExit && (
        <div className="zd-backdrop" onClick={() => setConfirmExit(false)}>
          <div className="zd-sheet" onClick={e => e.stopPropagation()}>
            <div className="zd-sheet-grip" />

            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                خروج از آزمون؟
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.7 }}>
                اگر الان خارج شوی، این آزمون نیمه‌کاره رها می‌شود و پاسخ‌هایت ثبت نمی‌شود.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button onClick={() => setConfirmExit(false)} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 50 }}>
                ادامه آزمون
              </button>
              <button onClick={onExit} className="zd-btn zd-btn-outline zd-btn-block"
                style={{ height: 46, color: 'var(--danger)', borderColor: 'color-mix(in oklab, var(--danger) 45%, transparent)' }}>
                خروج از آزمون
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Early-finish confirmation sheet (M6). Opening it does not submit; only the
          primary action calls finish(answers) — the same path as before. The timer
          keeps running underneath and an expiry-driven finish is still guarded. */}
      {confirmFinish && (
        <div className="zd-backdrop" onClick={() => setConfirmFinish(false)}>
          <div className="zd-sheet" role="dialog" aria-modal="true" aria-label="پایان آزمون" onClick={e => e.stopPropagation()}>
            <div className="zd-sheet-grip" />

            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                پایان آزمون؟
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.7 }}>
                آزمون با پاسخ‌های فعلی ثبت و نمره‌دهی می‌شود. سؤال‌های بی‌پاسخ نادرست محاسبه می‌شوند.
              </div>
            </div>

            {/* Answered tally (read-only) */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 14, padding: '10px 14px', borderRadius: 12,
              background: 'var(--card-2)', border: '1px solid var(--line)',
              fontSize: 13, fontWeight: 700, color: 'var(--ink-2)',
            }}>
              <span className="zd-num">به {fa(answeredCount)} از {fa(total)} سؤال پاسخ داده‌ای</span>
              {unansweredCount > 0 && (
                <span className="zd-chip zd-chip-danger zd-num" style={{ whiteSpace: 'nowrap' }}>
                  {fa(unansweredCount)} بی‌پاسخ
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button onClick={() => finish(answers)} className="zd-btn zd-btn-accent zd-btn-block" style={{ height: 50 }}>
                <FlagIcon size={18} stroke={2.1} /> پایان و مشاهده نتیجه
              </button>
              <button onClick={() => setConfirmFinish(false)} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 46 }}>
                ادامه آزمون
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
