import React from 'react'
import type { SourceExam } from '../types'
import { ChevRightIcon, ClockIcon, BookIcon } from '../components/Icons'
import { fa } from '../utils'

interface Props {
  exams: SourceExam[]
  onBack: () => void
  /** Phase 4A: safe no-op placeholder. Receives a random exam id (1..N). */
  onStartRandom: (id: number) => void
}

export function SourceExamScreen({ exams, onBack, onStartRandom }: Props) {
  function handleRandom() {
    if (exams.length === 0) return
    const pick = exams[Math.floor(Math.random() * exams.length)]
    onStartRandom(pick.id)
  }

  return (
    <div className="zd-scroll">
      {/* ── Header ── */}
      <div className="zd-header">
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onBack} aria-label="بازگشت">
            <ChevRightIcon size={18} />
          </button>
          <div />
        </div>
        <div style={{ marginTop: 6 }}>
          <div className="zd-eyebrow" style={{ marginBottom: 4 }}>آزمون‌های اصلی آیین‌نامه</div>
          <div className="zd-h1">آزمون‌های آیین‌نامه</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6 }}>
            یکی از آزمون‌های اصلی را انتخاب کن یا یک آزمون شانسی شروع کن.
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 8px' }}>
        {/* ── Random exam CTA (purple → orange) ── */}
        <button
          onClick={handleRandom}
          className="zd-btn zd-btn-block"
          style={{
            height: 58, marginBottom: 20,
            fontSize: 16, fontWeight: 800, color: '#fff',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          شروع آزمون شانسی 🎲
        </button>

        {/* ── 2-column grid of 17 exams ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {exams.map(exam => (
            <div key={exam.id} className="zd-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="flex items-center" style={{ gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: 'var(--primary-soft)', color: 'var(--primary)',
                  display: 'grid', placeItems: 'center',
                  fontWeight: 800, fontSize: 14,
                }}>
                  <span className="zd-num">{fa(exam.id)}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                  آزمون {fa(exam.id)}
                </div>
              </div>

              <div className="flex flex-col" style={{ gap: 6, fontSize: 12.5, color: 'var(--ink-3)' }}>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <BookIcon size={14} stroke={1.9} />
                  <span>{fa(exam.questionCount)} سؤال</span>
                </div>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <ClockIcon size={14} stroke={1.9} />
                  <span>{fa(exam.durationMinutes)} دقیقه</span>
                </div>
              </div>

              <span className="zd-chip zd-chip-neutral" style={{ alignSelf: 'flex-start' }}>
                هنوز شروع نشده
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
