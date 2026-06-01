import React, { useState } from 'react'
import type { SourceExam } from '../types'
import {
  ChevRightIcon, ChevLeftIcon, TrophyIcon, MoreIcon,
  BookIcon, ClockIcon, BulbIcon, PlayIcon, RefreshIcon,
} from '../components/Icons'
import { fa } from '../utils'
import { SOURCE_EXAM_PASS } from '../data/sourceExamBuilder'

interface Props {
  exams: SourceExam[]
  onBack: () => void
  /** Open the start screen for a chosen exam. */
  onOpenExam: (id: number) => void
  /** Launch an exam directly (from the random-reveal sheet). */
  onLaunchExam: (id: number) => void
}

/** Single exam card. Phase 4B: every exam is "not started" (no seeded statuses). */
function ExamCard({ exam, onOpen }: { exam: SourceExam; onOpen: (id: number) => void }) {
  return (
    <button
      onClick={() => onOpen(exam.id)}
      className="zd-card"
      style={{
        width: '100%', textAlign: 'right', cursor: 'pointer',
        border: 'none', fontFamily: 'var(--font)',
        padding: 14, borderRadius: 'var(--radius)',
        display: 'flex', flexDirection: 'column', gap: 12,
        minHeight: 132,
      }}
    >
      {/* top row: medallion + status chip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: 'var(--primary-soft)', color: 'var(--primary)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span className="zd-num" style={{ fontSize: 18, fontWeight: 800 }}>{fa(exam.id)}</span>
        </div>
        <span className="zd-chip zd-chip-neutral">جدید</span>
      </div>

      {/* title + meta */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>آزمون {fa(exam.id)}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--ink-3)', marginTop: 5, fontWeight: 600,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <BookIcon size={13} stroke={2} />
            <span className="zd-num">{fa(exam.questionCount)} سؤال</span>
          </span>
          <span style={{ width: 3, height: 3, borderRadius: 99, background: 'var(--ink-4)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ClockIcon size={13} stroke={2} />
            <span className="zd-num">{fa(exam.durationMinutes)} دقیقه</span>
          </span>
        </div>
      </div>

      {/* footer: status caption + go arrow */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid var(--line)', paddingTop: 10,
      }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)' }}>هنوز شروع نشده</span>
        <ChevLeftIcon size={16} color="var(--ink-4)" stroke={2.4} />
      </div>
    </button>
  )
}

export function SourceExamScreen({ exams, onBack, onOpenExam, onLaunchExam }: Props) {
  const [randomPick, setRandomPick] = useState<number | null>(null) // → reveal sheet
  const count = exams.length

  const rollRandom = () => setRandomPick(Math.floor(Math.random() * count) + 1)
  const reroll = () => setRandomPick(prev => {
    if (count <= 1) return prev
    let n = prev
    while (n === prev) n = Math.floor(Math.random() * count) + 1
    return n
  })

  return (
    <>
      <div className="zd-scroll">
        {/* Header */}
        <div className="zd-header">
          <div className="zd-header-row">
            <button className="zd-icon-btn" onClick={onBack} aria-label="بازگشت">
              <ChevRightIcon size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>
              <TrophyIcon size={16} color="var(--accent)" stroke={2} />
              <span className="zd-num">{fa(count)} آزمون رسمی</span>
            </div>
            <button className="zd-icon-btn" aria-label="بیشتر"><MoreIcon size={18} /></button>
          </div>

          <div style={{ marginTop: 6 }}>
            <div className="zd-h1">آزمون‌های آیین‌نامه</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.65, maxWidth: 320 }}>
              یکی از آزمون‌های اصلی را انتخاب کن یا یک آزمون شانسی شروع کن.
            </div>
          </div>
        </div>

        <div style={{ padding: '4px 20px 8px' }}>
          {/* Random exam CTA */}
          <button
            onClick={rollRandom}
            style={{
              width: '100%', cursor: 'pointer', border: 'none',
              fontFamily: 'var(--font)', textAlign: 'right',
              padding: 18, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--grad-via), var(--grad-to))',
              color: '#fff', position: 'relative', overflow: 'hidden',
              boxShadow: '0 12px 28px color-mix(in oklab, var(--grad-via) 38%, transparent)',
              display: 'flex', alignItems: 'center', gap: 16,
            }}
          >
            {/* warm glow accent */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(80% 120% at 12% 0%, color-mix(in oklab, var(--accent) 38%, transparent) 0%, transparent 55%)',
            }} />
            <div style={{
              position: 'relative',
              width: 56, height: 56, borderRadius: 18, flexShrink: 0,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              display: 'grid', placeItems: 'center', fontSize: 28,
              backdropFilter: 'blur(6px)',
            }}>🎲</div>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>شروع آزمون شانسی</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 4, lineHeight: 1.5 }}>
                یکی از {fa(count)} آزمون به‌صورت تصادفی انتخاب می‌شود
              </div>
            </div>
            <ChevLeftIcon size={20} color="rgba(255,255,255,0.9)" stroke={2.4} />
          </button>

          {/* section label */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '24px 2px 12px' }}>
            <div className="zd-h2">همهٔ آزمون‌ها</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>۳۰ سؤال · ۲۰ دقیقه</div>
          </div>

          {/* Exam grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {exams.map(exam => <ExamCard key={exam.id} exam={exam} onOpen={onOpenExam} />)}
          </div>

          {/* source footnote */}
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            marginTop: 18, padding: 14, borderRadius: 'var(--radius-sm)',
            background: 'var(--card-2)', border: '1px solid var(--line)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10, flexShrink: 0,
              background: 'color-mix(in oklab, var(--accent) 16%, transparent)',
              color: 'var(--accent-deep)', display: 'grid', placeItems: 'center',
            }}>
              <BulbIcon size={16} />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.65 }}>
              این آزمون‌ها بر پایهٔ منبع رسمی آیین‌نامه طراحی شده‌اند. هر آزمون مانند آزمون واقعی، ۳۰ سؤال دارد و زمان پیشنهادی آن ۲۰ دقیقه است.
            </div>
          </div>
        </div>
      </div>

      {/* Random exam reveal — bottom sheet */}
      {randomPick !== null && (
        <div className="zd-backdrop" onClick={() => setRandomPick(null)}>
          <div className="zd-sheet" onClick={e => e.stopPropagation()}>
            <div className="zd-sheet-grip" />
            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <div className="zd-dice-roll" key={randomPick} style={{
                width: 76, height: 76, borderRadius: 24, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
                display: 'grid', placeItems: 'center', fontSize: 38,
                boxShadow: '0 12px 26px color-mix(in oklab, var(--accent) 35%, transparent)',
              }}>🎲</div>
              <div className="zd-eyebrow" style={{ color: 'var(--accent-deep)', fontWeight: 700 }}>آزمون شانسی</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                آزمون {fa(randomPick)} برای تو انتخاب شد
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.6 }}>
                ۳۰ سؤال · ۲۰ دقیقه · نمره قبولی {fa(SOURCE_EXAM_PASS)} از ۳۰
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <button onClick={() => { const n = randomPick; setRandomPick(null); onLaunchExam(n) }}
                className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 52, fontSize: 16, whiteSpace: 'nowrap' }}>
                <PlayIcon size={17} stroke={2.4} /> شروع آزمون {fa(randomPick)}
              </button>
              <button onClick={reroll} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 46, fontSize: 14, whiteSpace: 'nowrap' }}>
                <RefreshIcon size={16} stroke={2.1} /> انتخاب آزمون دیگر
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
