import React, { useState } from 'react'
import type { ExamMeta } from '../types'
import {
  ChevRightIcon, ChevLeftIcon, BookIcon, ClockIcon, TrophyIcon, RefreshIcon, BulbIcon, PlayIcon,
} from '../components/Icons'
import { fa } from '../utils'

interface Props {
  /** Unified 1..18 registry (17 official source exams + Exam 18 review). */
  exams: ExamMeta[]
  /** Start the timed exam runner for a chosen exam. */
  onOpenExam: (id: number) => void
  /** Back to home. */
  onExitToHome: () => void
}

/** Single exam card. Exam framing: shows question count + duration. Exam 18
 *  (supplementary) is visually distinguished as «مرور تکمیلی». */
function ExamCard({ exam, onOpen }: { exam: ExamMeta; onOpen: (id: number) => void }) {
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
        minHeight: 140,
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
          <span className="zd-chip" style={{
            background: 'color-mix(in oklab, var(--accent) 14%, transparent)',
            color: 'var(--accent-deep)',
          }}>
            <TrophyIcon size={12} stroke={2} /> رسمی
          </span>
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
          <span style={{ width: 3, height: 3, borderRadius: 99, background: 'var(--ink-4)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ClockIcon size={13} stroke={2} />
            <span className="zd-num">{fa(exam.durationMinutes)} دقیقه</span>
          </span>
        </div>
      </div>

      {/* footer: caption + go arrow */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid var(--line)', paddingTop: 10,
      }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent-deep)' }}>
          {supplementary ? 'مرور تکمیلی' : 'شروع آزمون'}
        </span>
        <ChevLeftIcon size={16} color="var(--accent-deep)" stroke={2.4} />
      </div>
    </button>
  )
}

export function ExamCatalogScreen({ exams, onOpenExam, onExitToHome }: Props) {
  const official = exams.filter(e => e.official)
  const review   = exams.filter(e => !e.official)

  // Random exam start — official exams (1..17) only; never Exam 18.
  const [randomPick, setRandomPick] = useState<number | null>(null) // → reveal sheet
  const pickOfficialId = () => official[Math.floor(Math.random() * official.length)].id
  const rollRandom = () => { if (official.length) setRandomPick(pickOfficialId()) }
  const reroll = () => setRandomPick(prev => {
    if (official.length <= 1) return prev
    let n = prev
    while (n === prev) n = pickOfficialId()
    return n
  })
  const pickedMeta = randomPick != null ? official.find(e => e.id === randomPick) : undefined

  return (
    <>
    <div className="zd-scroll">
      {/* Header */}
      <div className="zd-header">
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onExitToHome} aria-label="بازگشت">
            <ChevRightIcon size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>
            <TrophyIcon size={16} color="var(--accent)" stroke={2} />
            <span className="zd-num">{fa(exams.length)} آزمون</span>
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ marginTop: 6 }}>
          <div className="zd-h1">آزمون‌ها</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.65, maxWidth: 320 }}>
            یک آزمون را انتخاب کن و در شرایط واقعی امتحان بده: با زمان‌بندی و بدون نمایش فوری پاسخ. نتیجه در پایان نمایش داده می‌شود.
          </div>
          <div style={{ marginTop: 12 }}>
            <span className="zd-chip" style={{
              background: 'color-mix(in oklab, var(--accent) 14%, transparent)',
              color: 'var(--accent-deep)',
            }}>
              <ClockIcon size={13} stroke={2} /> با زمان · نتیجه در پایان
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 20px 8px' }}>
        {/* Random exam CTA — official exams only */}
        <button
          onClick={rollRandom}
          style={{
            width: '100%', cursor: 'pointer', border: 'none',
            fontFamily: 'var(--font)', textAlign: 'right',
            padding: 18, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--grad-via), var(--grad-to))',
            color: '#fff', position: 'relative', overflow: 'hidden',
            boxShadow: '0 12px 28px color-mix(in oklab, var(--grad-via) 38%, transparent)',
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4,
          }}
        >
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
              یکی از {fa(official.length)} آزمون رسمی به‌صورت تصادفی انتخاب می‌شود
            </div>
          </div>
          <ChevLeftIcon size={20} color="rgba(255,255,255,0.9)" stroke={2.4} />
        </button>

        {/* Official exams 1..17 */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '8px 2px 12px' }}>
          <div className="zd-h2">آزمون‌های آیین‌نامه</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>با زمان · بدون نمایش پاسخ</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {official.map(exam => <ExamCard key={exam.id} exam={exam} onOpen={onOpenExam} />)}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {review.map(exam => <ExamCard key={exam.id} exam={exam} onOpen={onOpenExam} />)}
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
            background: 'color-mix(in oklab, var(--accent) 16%, transparent)',
            color: 'var(--accent-deep)', display: 'grid', placeItems: 'center',
          }}>
            <BulbIcon size={16} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.65 }}>
            آزمون‌های ۱ تا ۱۷ بر پایهٔ منبع رسمی آیین‌نامه‌اند و مانند آزمون واقعی، ۳۰ سؤال در ۲۰ دقیقه دارند. «آزمون ۱۸ — مرور تکمیلی» یک آزمون تمرینی غیررسمی برای مرور بیشتر است.
          </div>
        </div>
      </div>
    </div>

    {/* Random exam reveal — bottom sheet (official exams 1..17 only) */}
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
              {fa(pickedMeta?.questionCount ?? 30)} سؤال · {fa(pickedMeta?.durationMinutes ?? 20)} دقیقه · نمره قبولی {fa(pickedMeta?.passThreshold ?? 26)} از {fa(pickedMeta?.questionCount ?? 30)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <button onClick={() => { const n = randomPick; setRandomPick(null); onOpenExam(n) }}
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
