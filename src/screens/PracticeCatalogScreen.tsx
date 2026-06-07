import React from 'react'
import type { ExamMeta } from '../types'
import { ChevRightIcon, ChevLeftIcon, BookIcon, BulbIcon, RefreshIcon } from '../components/Icons'
import { fa } from '../utils'

interface Props {
  /** Unified 1..18 registry (17 official source exams + Exam 18 review). */
  exams: ExamMeta[]
  /** Open the practice runner for a chosen exam. */
  onOpenExam: (id: number) => void
  /** Back to home. */
  onExitToHome: () => void
}

/** Single practice exam card. Learning-focused: shows question count, no timer.
 *  Exam 18 (supplementary) is visually distinguished as «مرور تکمیلی». */
function PracticeCard({ exam, onOpen }: { exam: ExamMeta; onOpen: (id: number) => void }) {
  const supplementary = !exam.official
  return (
    <button
      onClick={() => onOpen(exam.id)}
      className="zd-card"
      style={{
        width: '100%', textAlign: 'right', cursor: 'pointer',
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
        {supplementary ? (
          <span className="zd-chip" style={{
            background: 'color-mix(in oklab, var(--accent) 16%, transparent)',
            color: 'var(--accent-deep)',
          }}>
            <RefreshIcon size={12} stroke={2} /> مرور تکمیلی
          </span>
        ) : (
          <span className="zd-chip zd-chip-neutral">تمرین</span>
        )}
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
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)' }}>
          {supplementary ? 'مرور آزاد' : 'تمرین با پاسخ فوری'}
        </span>
        <ChevLeftIcon size={16} color="var(--ink-4)" stroke={2.4} />
      </div>
    </button>
  )
}

export function PracticeCatalogScreen({ exams, onOpenExam, onExitToHome }: Props) {
  const official = exams.filter(e => e.official)
  const review   = exams.filter(e => !e.official)

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
        </div>
      </div>

      <div style={{ padding: '4px 20px 8px' }}>
        {/* Official exams 1..17 */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '8px 2px 12px' }}>
          <div className="zd-h2">آزمون‌های آیین‌نامه</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>پاسخ فوری · بدون تایمر</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {official.map(exam => <PracticeCard key={exam.id} exam={exam} onOpen={onOpenExam} />)}
        </div>

        {/* Supplementary review (Exam 18) */}
        {review.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '24px 2px 12px' }}>
              <div className="zd-h2">مرور تکمیلی</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>غیررسمی</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {review.map(exam => <PracticeCard key={exam.id} exam={exam} onOpen={onOpenExam} />)}
            </div>
          </>
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
            color: 'var(--primary)', display: 'grid', placeItems: 'center',
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
