import React, { useMemo } from 'react'
import type { ExamMeta } from '../types'
import type { ExamProgressReadItem } from '../data/progress/repo'
import { ChevRightIcon, ChevLeftIcon, BookIcon, BulbIcon, RefreshIcon, LockIcon } from '../components/Icons'
import { fa } from '../utils'

interface Props {
  /** Unified 1..18 registry (17 official source exams + Exam 18 review). */
  exams: ExamMeta[]
  /** Per-exam cloud progress; null = guest / not loaded / unavailable. */
  coverage: ExamProgressReadItem[] | null
  /** Open the practice runner for a chosen exam. */
  onOpenExam: (id: number) => void
  /** Soft gate (S4B): true when this exam requires a subscription. Optional;
   *  when omitted nothing is locked (paywall off / default build). */
  isLocked?: (examId: number) => boolean
  /** Back to home. */
  onExitToHome: () => void
}

/** Coverage label for one exam, from the real practiced-question count.
 *  Returns null when nothing was practiced (card stays unchanged). The count
 *  is capped at the exam size, so a shrunken bank can never overflow the chip.
 *  Labels are deliberately short — the chip shares a ~134px card row with the
 *  exam medallion, so anything longer truncates on 375px screens. */
function coverageLabel(answeredCount: number | undefined, questionCount: number) {
  if (!answeredCount || answeredCount <= 0) return null
  const n = Math.min(answeredCount, questionCount)
  const complete = n >= questionCount
  return {
    text: complete ? 'کامل' : `${fa(n)}/${fa(questionCount)}`,
    complete,
  }
}

/** Single practice exam card. Learning-focused: shows question count, no timer.
 *  Exam 18 (supplementary) is visually distinguished as «مرور تکمیلی». With real
 *  practiced-question data, a coverage chip («تمرین/کامل · N از M») replaces the
 *  static «پاسخ فوری» chip; supplementary keeps its identity chip and shows the
 *  coverage in the footer caption instead. Unpracticed cards are unchanged. */
function PracticeCard({ exam, answeredCount, locked, free, onOpen }: { exam: ExamMeta; answeredCount: number | undefined; locked: boolean; free: boolean; onOpen: (id: number) => void }) {
  const supplementary = !exam.official
  const cov = coverageLabel(answeredCount, exam.questionCount)
  const covColors = cov?.complete
    ? { background: 'var(--success-soft)', color: 'var(--success)' }
    : { background: 'var(--primary-soft)', color: 'var(--chip-info-ink)' }
  return (
    <button
      onClick={() => onOpen(exam.id)}
      className="zd-card"
      style={{
        // minWidth 0 lets the card shrink inside its grid column (grid items
        // default to min-width:auto, so long chip text would widen the column).
        width: '100%', minWidth: 0, textAlign: 'right', cursor: 'pointer',
        border: supplementary
          ? '1px solid color-mix(in oklab, var(--accent) 32%, transparent)'
          : 'none',
        fontFamily: 'var(--font)',
        padding: 14, borderRadius: 'var(--radius)',
        display: 'flex', flexDirection: 'column', gap: 12,
        minHeight: 132,
      }}
    >
      {/* top row: medallion + kind chip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: supplementary ? 'color-mix(in oklab, var(--accent) 16%, transparent)' : 'var(--primary-soft)',
          color: supplementary ? 'var(--accent-deep)' : 'var(--primary)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span className="zd-num" style={{ fontSize: 18, fontWeight: 800 }}>{fa(exam.id)}</span>
        </div>
        {locked ? (
          <span
            role="img"
            aria-label="برای دسترسی، اشتراک لازم است"
            title="برای دسترسی، اشتراک لازم است"
            style={{
              width: 28, height: 28, borderRadius: 9, flexShrink: 0,
              background: 'var(--card-2)', color: 'var(--ink-3)',
              border: '1px solid var(--line)',
              display: 'grid', placeItems: 'center',
            }}
          >
            <LockIcon size={14} stroke={2} />
          </span>
        ) : free ? (
          <span className="zd-chip" style={{
            background: 'var(--success-soft)', color: 'var(--success)', whiteSpace: 'nowrap',
          }}>رایگان</span>
        ) : supplementary ? (
          <span className="zd-chip" style={{
            background: 'color-mix(in oklab, var(--accent) 16%, transparent)',
            color: 'var(--accent-deep)',
          }}>
            <RefreshIcon size={12} stroke={2} /> مرور تکمیلی
          </span>
        ) : cov ? (
          // Real per-exam practice progress (distinct answered / total). Only shown
          // when the loaded coverage has data; unpracticed cards show no badge (the
          // repeated «پاسخ فوری» chip is dropped — the section header already says it).
          <span className="zd-chip zd-num" style={{ ...covColors, minWidth: 0, maxWidth: '100%' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cov.text}
            </span>
          </span>
        ) : null}
      </div>

      {/* title + meta */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{exam.title}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--ink-3)', marginTop: 5, fontWeight: 600,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <BookIcon size={13} stroke={2} />
            <span className="zd-num">{fa(exam.questionCount)} سؤال</span>
          </span>
        </div>
      </div>

      {/* footer: caption + go arrow */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid var(--line)', paddingTop: 10,
      }}>
        {locked ? (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-3)' }}>
            نیاز به اشتراک
          </span>
        ) : supplementary && cov ? (
          <span className="zd-num" style={{
            fontSize: 11.5, fontWeight: 700, color: covColors.color,
            whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {cov.text}
          </span>
        ) : (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: supplementary ? 'var(--accent-deep)' : 'var(--chip-info-ink)' }}>
            {supplementary ? 'مرور آزاد' : 'شروع تمرین'}
          </span>
        )}
        <ChevLeftIcon size={16} color="var(--ink-4)" stroke={2.4} />
      </div>
    </button>
  )
}

export function PracticeCatalogScreen({ exams, coverage, onOpenExam, isLocked, onExitToHome }: Props) {
  const official = exams.filter(e => e.official)
  const review   = exams.filter(e => !e.official)

  // Gating "in effect" only when some exam is locked (paywall on + non-subscriber);
  // then accessible cards get a «رایگان» chip. Otherwise no lock/free chips.
  const lockedOf = (id: number) => isLocked?.(id) ?? false
  const gating = exams.some(e => lockedOf(e.id))

  // examId → distinct practiced-question count, from the loaded cloud progress.
  // null/empty coverage → empty map → no chips anywhere (guest / not loaded).
  const countByExam = useMemo(() =>
    new Map((coverage ?? []).map(it => [it.examId, it.answeredCount])), [coverage])

  return (
    <div className="zd-scroll">
      {/* Header */}
      <div className="zd-header">
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onExitToHome} aria-label="بازگشت">
            <ChevRightIcon size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>
            <BookIcon size={16} color="var(--primary)" stroke={2} />
            <span className="zd-num">{fa(exams.length)} آزمون</span>
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ marginTop: 6 }}>
          <div className="zd-h1">تمرین آزمون‌ها</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.65, maxWidth: 320 }}>
            یک آزمون را برای تمرین انتخاب کن. در حالت تمرین، بدون محدودیت زمان، پاسخ درست را بلافاصله می‌بینی.
          </div>
          <div style={{ marginTop: 12 }}>
            <span className="zd-chip" style={{ background: 'var(--primary-soft)', color: 'var(--chip-info-ink)' }}>
              <BulbIcon size={13} stroke={2} /> پاسخ فوری · بدون زمان
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 20px 8px' }}>
        {/* Official exams 1..17 */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '8px 2px 12px' }}>
          <div className="zd-h2">آزمون‌های آیین‌نامه</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>پاسخ فوری · بدون تایمر</div>
        </div>
        {/* minmax(0,1fr) keeps both columns equal even if a card's content
            (e.g. a coverage chip) would otherwise refuse to shrink. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          {official.map(exam => { const locked = lockedOf(exam.id); return <PracticeCard key={exam.id} exam={exam} answeredCount={countByExam.get(exam.id)} locked={locked} free={gating && !locked} onOpen={onOpenExam} /> })}
        </div>

        {/* Supplementary review (Exam 18) */}
        {review.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 2px 12px' }}>
              <div className="zd-h2">مرور تکمیلی</div>
              <span className="zd-chip" style={{
                background: 'color-mix(in oklab, var(--accent) 16%, transparent)',
                color: 'var(--accent-deep)',
              }}>غیررسمی</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              {review.map(exam => { const locked = lockedOf(exam.id); return <PracticeCard key={exam.id} exam={exam} answeredCount={countByExam.get(exam.id)} locked={locked} free={gating && !locked} onOpen={onOpenExam} /> })}
            </div>
          </>
        )}

        {/* Lock legend — only when some card is locked (paywall on, non-subscriber). */}
        {gating && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
            marginTop: 16, fontSize: 12, color: 'var(--ink-3)', fontWeight: 600,
          }}>
            <LockIcon size={13} stroke={2} /> برای دسترسی، اشتراک لازم است.
          </div>
        )}

        {/* footnote */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          marginTop: 18, padding: 14, borderRadius: 'var(--radius-sm)',
          background: 'var(--card-2)', border: '1px solid var(--line)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
            background: 'color-mix(in oklab, var(--primary) 16%, transparent)',
            color: 'var(--chip-info-ink)', display: 'grid', placeItems: 'center',
          }}>
            <BulbIcon size={16} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.65 }}>
            آزمون‌های ۱ تا ۱۷ بر پایهٔ منبع رسمی آیین‌نامه هستند. «آزمون ۱۸ — مرور تکمیلی» یک مجموعهٔ تمرینی غیررسمی برای مرور بیشتر است.
          </div>
        </div>
      </div>
    </div>
  )
}
