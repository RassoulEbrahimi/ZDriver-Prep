import React, { useState, useMemo } from 'react'
import type { Question, Category, Progress, SourceExamQuestion } from '../types'
import {
  ChevRightIcon, CheckIcon, CloseIcon, BulbIcon, ImageIcon,
  BookmarkIcon, BookmarkFilledIcon, RefreshIcon, AwardIcon,
} from '../components/Icons'
import { QuestionImagePlaceholder } from '../components/QuestionImagePlaceholder'
import { fa } from '../utils'
import { getExamMeta, loadExamQuestions } from '../data/examRegistry'

interface Props {
  examId: number
  /** Fallback pool for source exams without real data yet (placeholder builder). */
  fallbackPool: Question[]
  categories: Category[]
  progress: Progress
  onToggleBookmark: (id: string) => void
  onRecordWrong: (ids: string[]) => void
  /** Best-effort cloud mirror of a single answered question (Phase 7G). The
   *  screen stays cloud-agnostic — App owns the actual Firestore write. */
  onPracticeAnswer?: (a: { questionId: string; correct: boolean; index: number; official: boolean }) => void
  /** Back to the practice catalog. */
  onExit: () => void

  // ── Review mode (Phase 7N) — all optional and guarded. When reviewPool is
  // not provided, every code path below is identical to the practice flow. ──
  /** Fixed question set for a review session; bypasses the exam loader. */
  reviewPool?: SourceExamQuestion[]
  /** Header title override for review sessions (e.g. «مرور اشتباهات»). */
  sessionTitle?: string
  /** Per-answer result callback for review sessions (App clears cleared-up
   *  mistakes); practice sessions never call this. */
  onReviewResult?: (questionId: string, correct: boolean) => void
}

const OPT_LETTERS = ['الف', 'ب', 'ج', 'د']

/**
 * Exam-based Practice runner (تمرین). Learning-focused: no timer, instant answer
 * reveal after "بررسی پاسخ", explanation shown when available, and a lightweight
 * local completion card at the end. Image-dependent questions reuse the shared
 * QuestionImagePlaceholder (real image for Exam 1, striped placeholder otherwise).
 */
export function PracticeExamQuestionScreen({
  examId, fallbackPool, categories, progress, onToggleBookmark, onRecordWrong, onPracticeAnswer, onExit,
  reviewPool, sessionTitle, onReviewResult,
}: Props) {
  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const review = reviewPool !== undefined
  const meta = getExamMeta(examId)
  // Review mode uses its fixed pool; otherwise 1..17 → source loader (real data
  // + placeholder fallback); 18 → generic bank.
  const exam = useMemo(
    () => reviewPool ?? loadExamQuestions(examId, fallbackPool),
    [examId, fallbackPool, reviewPool],
  )
  const total = exam.length

  const [idx,       setIdx]       = useState(0)
  const [selected,  setSelected]  = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [done,      setDone]      = useState(false)

  const q   = exam[idx]
  const cat = q ? catMap[q.cat] : undefined
  const isLast = idx === total - 1
  const correctIdx = q?.answer
  const isCorrect = submitted && selected === correctIdx
  const title = sessionTitle ?? meta?.title ?? `آزمون ${fa(examId)}`
  const official = meta?.official ?? true

  function optClass(i: number): string {
    if (submitted) {
      if (i === correctIdx) return 'zd-option is-correct'
      if (i === selected)   return 'zd-option is-wrong'
    } else if (i === selected) {
      return 'zd-option is-selected'
    }
    return 'zd-option'
  }

  function handleCheck() {
    if (selected === null) return
    setSubmitted(true)
    const correct = selected === correctIdx
    if (!correct) onRecordWrong([q.id])
    // Best-effort cloud mirror (Phase 7G); App decides whether to write.
    onPracticeAnswer?.({ questionId: q.id, correct, index: idx, official })
    // Review sessions report each result so App can clear cleared-up mistakes.
    onReviewResult?.(q.id, correct)
  }

  function handleNext() {
    setSelected(null)
    setSubmitted(false)
    setIdx(i => i + 1)
  }

  function restart() {
    setDone(false)
    setIdx(0)
    setSelected(null)
    setSubmitted(false)
  }

  // ── Lightweight completion state (local only; no score / no pass-fail) ──
  if (done) {
    return (
      <div className="zd-scroll">
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div className="zd-card zd-fade-up" style={{ width: '100%', maxWidth: 360, padding: 28, textAlign: 'center' }}>
            <div className="zd-pop" style={{
              width: 80, height: 80, borderRadius: 26, margin: '0 auto 18px',
              background: 'linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 70%, #fff))',
              display: 'grid', placeItems: 'center', color: '#fff',
              boxShadow: '0 12px 28px color-mix(in oklab, var(--primary) 32%, transparent)',
            }}>
              <AwardIcon size={42} stroke={1.8} />
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--ink)' }}>
              {review ? 'مرور تمام شد' : 'تمرین تمام شد'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.7 }}>
              {review
                ? 'هر سؤالی که درست جواب دادی از فهرست اشتباهات پاک شد.'
                : 'همه سؤال‌های این آزمون را مرور کردی.'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              <button onClick={onExit} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 52, fontSize: 15 }}>
                {review ? 'بازگشت به اشتباهات' : 'بازگشت به لیست آزمون‌ها'}
              </button>
              <button onClick={restart} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 48, fontSize: 14 }}>
                <RefreshIcon size={16} stroke={2.1} /> {review ? 'مرور دوباره' : 'تمرین دوباره'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sessionPct = ((idx + 1) / total) * 100

  return (
    <div className="zd-scroll">
      {/* Header */}
      <div className="zd-header">
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onExit} aria-label="بازگشت">
            <ChevRightIcon size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>
            <span>{title}</span>
            {!official && !review && (
              <span className="zd-chip" style={{
                background: 'color-mix(in oklab, var(--accent) 16%, transparent)',
                color: 'var(--accent-deep-text)',
              }}>مرور تکمیلی · غیررسمی</span>
            )}
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {review ? 'حالت مرور · بدون زمان' : 'حالت تمرین · بدون زمان'}
            </div>
            <div className="zd-num" style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>
              {fa(idx + 1)} از {fa(total)}
            </div>
          </div>
          <div className="zd-bar"><div className="zd-bar-fill" style={{ width: `${sessionPct}%` }} /></div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 24px' }}>
        <div className="zd-card zd-fade-up" key={idx} style={{ padding: 20 }}>
          {/* chips: category + image marker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="zd-chip" style={{
              background: `color-mix(in oklab, ${cat?.color ?? 'var(--primary)'} 14%, transparent)`,
              // 55% toward --tint-ink: AA for all five category colors in both
              // themes on the 14% tint (see --tint-ink in index.css).
              color: `color-mix(in oklab, ${cat?.color ?? 'var(--primary)'} 55%, var(--tint-ink))`,
            }}>
              {cat?.emoji} {cat?.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {q.hasImage && (
                <span className="zd-chip zd-chip-neutral">
                  <ImageIcon size={13} stroke={2} /> سؤال تصویری
                </span>
              )}
              <button onClick={() => onToggleBookmark(q.id)} aria-label="نشان‌گذاری"
                aria-pressed={progress.bookmarked.includes(q.id)} style={{
                background: progress.bookmarked.includes(q.id) ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'transparent',
                border: 'none', cursor: 'pointer',
                width: 44, height: 44, borderRadius: 13,
                display: 'grid', placeItems: 'center',
                color: progress.bookmarked.includes(q.id) ? 'var(--accent-deep-text)' : 'var(--ink-3)',
              }}>
                {progress.bookmarked.includes(q.id) ? <BookmarkFilledIcon size={19} /> : <BookmarkIcon size={19} />}
              </button>
            </div>
          </div>

          {/* image (real for Exam 1; placeholder for imagePending) */}
          {q.hasImage && <QuestionImagePlaceholder src={q.image} />}

          {/* question text */}
          <div style={{ fontSize: 17, lineHeight: 1.65, fontWeight: 600, color: 'var(--ink)' }}>{q.text}</div>

          {/* options with reveal feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {q.options.map((opt, i) => (
              <button key={i} className={optClass(i)} onClick={() => !submitted && setSelected(i)}>
                <div className="zd-opt-letter">{OPT_LETTERS[i] ?? fa(i + 1)}</div>
                <div className="zd-opt-text">{opt}</div>
                <div className="zd-opt-mark">
                  {submitted && i === correctIdx && <CheckIcon size={22} color="var(--success)" stroke={2.4} />}
                  {submitted && i === selected && i !== correctIdx && <CloseIcon size={22} color="var(--danger)" stroke={2.4} />}
                </div>
              </button>
            ))}
          </div>

          {/* explanation (only when available) */}
          {submitted && q.explanation && (
            <div className="zd-fade-up" style={{
              marginTop: 16, padding: 14,
              background: isCorrect ? 'var(--success-soft)' : 'var(--primary-soft)',
              borderRadius: 14,
              border: `1px solid ${isCorrect
                ? 'color-mix(in oklab, var(--success) 30%, transparent)'
                : 'color-mix(in oklab, var(--primary) 20%, transparent)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: isCorrect ? 'var(--success)' : 'var(--primary)',
                  color: '#fff', display: 'grid', placeItems: 'center',
                }}>
                  {isCorrect ? <CheckIcon size={16} stroke={2.6} /> : <BulbIcon size={16} stroke={2} />}
                </div>
                {/* --primary-ink is not dark-overridden (≈1.05:1 on dark --primary-soft);
                    the ink tokens read ≥4.9:1 in both themes. */}
                <div style={{ fontWeight: 700, fontSize: 14, color: isCorrect ? 'var(--success-ink)' : 'var(--chip-info-ink)' }}>
                  {isCorrect ? 'پاسخ درست' : 'توضیح'}
                </div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>{q.explanation}</div>
            </div>
          )}
        </div>

        {/* primary action */}
        {!submitted ? (
          <button onClick={handleCheck} disabled={selected === null}
                  className="zd-btn zd-btn-primary zd-btn-block"
                  style={{ marginTop: 16, height: 54, fontSize: 16, opacity: selected === null ? 0.5 : 1 }}>
            بررسی پاسخ
            <CheckIcon size={18} stroke={2.4} />
          </button>
        ) : isLast ? (
          <button onClick={() => setDone(true)}
                  className="zd-btn zd-btn-accent zd-btn-block"
                  style={{ marginTop: 16, height: 54, fontSize: 16 }}>
            {review ? 'پایان مرور' : 'پایان تمرین'}
          </button>
        ) : (
          <button onClick={handleNext}
                  className="zd-btn zd-btn-primary zd-btn-block"
                  style={{ marginTop: 16, height: 54, fontSize: 16 }}>
            سؤال بعدی
            <ChevRightIcon size={18} stroke={2.4} />
          </button>
        )}
      </div>
    </div>
  )
}
