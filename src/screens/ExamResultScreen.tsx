import React from 'react'
import type { ExamResult } from '../types'
import { ProgressRing } from '../components/ProgressRing'
import { StatCard } from '../components/StatCard'
import { AwardIcon, CloseIcon, RefreshIcon, CheckIcon, ClockIcon } from '../components/Icons'
import { fa, formatTime } from '../utils'

interface Props {
  result: ExamResult
  onRetry: () => void
  onReviewWrong: () => void
  onHome: () => void
}

export function ExamResultScreen({ result, onRetry, onReviewWrong, onHome }: Props) {
  const { correct, total, timeUsed, exam, answers } = result
  const pass       = correct >= 25
  const pct        = Math.round((correct / total) * 100)
  const wrongCount = total - correct

  return (
    <div className="zd-scroll">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ paddingTop: 60, paddingBottom: 28 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: pass
            ? 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--success) 30%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--card), var(--bg))'
            : 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--danger) 22%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--card), var(--bg))',
        }} />
        <div className="relative text-center" style={{ padding: '0 24px' }}>
          <div className="zd-pop" style={{
            width: 96, height: 96, borderRadius: 32,
            margin: '0 auto 18px',
            background: pass
              ? 'linear-gradient(135deg, var(--success), color-mix(in oklab, var(--success) 70%, #fff))'
              : 'linear-gradient(135deg, var(--danger),  color-mix(in oklab, var(--danger)  70%, #fff))',
            display: 'grid', placeItems: 'center', color: '#fff',
            boxShadow: pass
              ? '0 14px 32px color-mix(in oklab, var(--success) 35%, transparent)'
              : '0 14px 32px color-mix(in oklab, var(--danger) 30%, transparent)',
          }}>
            {pass ? <AwardIcon size={56} stroke={1.8} /> : <CloseIcon size={48} stroke={2.4} />}
          </div>

          <div className="zd-eyebrow" style={{ color: pass ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: 13 }}>
            {pass ? 'تبریک — قبول شدی' : 'این بار قبول نشدی'}
          </div>
          <div className="zd-h1" style={{ marginTop: 6 }}>
            <span className="zd-num">{fa(correct)} از {fa(total)}</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 6 }}>
            {pass
              ? 'برای آزمون رسمی آماده‌ای — یک بار دیگر هم تکرار کن.'
              : `${fa(25 - correct)} پاسخ درست دیگر تا قبولی نیاز داشتی.`}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Score card */}
        <div className="zd-card" style={{ padding: 18 }}>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="zd-eyebrow">امتیاز شما</div>
              <div className="zd-num" style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--ink)' }}>
                {fa(pct)}<span style={{ fontSize: 16 }}>٪</span>
              </div>
            </div>
            <ProgressRing value={pct} size={70} stroke={6}
                          color={pass ? 'var(--success)' : 'var(--danger)'}
                          bg="var(--line)">
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{pass ? 'قبول' : 'رد'}</div>
            </ProgressRing>
          </div>
          <div className="zd-bar" style={{ marginTop: 14 }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pass ? 'var(--success)' : 'var(--danger)',
              borderRadius: 999, transition: 'width .8s',
            }} />
          </div>
          <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
            <span>۰</span>
            <span>قبولی: {fa(25)}</span>
            <span>{fa(30)}</span>
          </div>
        </div>

        {/* Detailed stats */}
        <div className="flex" style={{ gap: 10, marginTop: 12 }}>
          <StatCard label="پاسخ درست"   value={fa(correct)}           color="var(--success)" icon={CheckIcon} />
          <StatCard label="پاسخ اشتباه" value={fa(wrongCount)}        color="var(--danger)"  icon={CloseIcon} />
          <StatCard label="زمان"         value={formatTime(timeUsed)}  color="var(--primary)" icon={ClockIcon} />
        </div>

        {/* Per-question grid */}
        <div className="zd-card" style={{ padding: 18, marginTop: 14 }}>
          <div className="zd-eyebrow" style={{ marginBottom: 10 }}>پاسخ‌نامه</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5 }}>
            {exam.map((q, i) => {
              const ans     = answers[i]
              const correct = ans === q.answer
              const skipped = ans === null
              return (
                <div key={i} style={{
                  aspectRatio: '1/1', borderRadius: 8,
                  background: skipped ? 'var(--line)' : correct ? 'var(--success)' : 'var(--danger)',
                  color: '#fff', display: 'grid', placeItems: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {fa(i + 1)}
                </div>
              )
            })}
          </div>
          <div className="flex" style={{ gap: 12, marginTop: 12, fontSize: 11, color: 'var(--ink-3)' }}>
            {[
              { bg: 'var(--success)', label: 'درست' },
              { bg: 'var(--danger)',  label: 'اشتباه' },
              { bg: 'var(--line)',    label: 'پاسخ نداده' },
            ].map(({ bg, label }) => (
              <span key={label} className="flex items-center" style={{ gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: bg, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col" style={{ gap: 10, marginTop: 16 }}>
          <button onClick={onReviewWrong} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 50 }}>
            <RefreshIcon size={18} stroke={2.2} />
            مرور سؤالات اشتباه
          </button>
          <div className="flex" style={{ gap: 10 }}>
            <button onClick={onRetry} className="zd-btn zd-btn-outline" style={{ flex: 1, height: 46 }}>آزمون جدید</button>
            <button onClick={onHome}  className="zd-btn zd-btn-ghost"   style={{ flex: 1, height: 46 }}>بازگشت به مسیر</button>
          </div>
        </div>
      </div>
    </div>
  )
}
