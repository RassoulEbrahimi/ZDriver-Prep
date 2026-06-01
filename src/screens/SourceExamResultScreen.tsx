import React from 'react'
import type { SourceExamResult } from '../types'
import { ProgressRing } from '../components/ProgressRing'
import { StatCard } from '../components/StatCard'
import { AwardIcon, CloseIcon, CheckIcon, FlagIcon, RefreshIcon } from '../components/Icons'
import { fa } from '../utils'
import { SOURCE_EXAM_PASS } from '../data/sourceExamBuilder'

interface Props {
  result: SourceExamResult
  onReviewWrong: () => void
  onRetry: () => void
  onBackToExams: () => void
}

export function SourceExamResultScreen({ result, onReviewWrong, onRetry, onBackToExams }: Props) {
  const { examNo, correct, total } = result
  const pass  = correct >= SOURCE_EXAM_PASS
  const pct   = Math.round((correct / total) * 100)
  const wrong = total - correct

  return (
    <div className="zd-scroll">
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 60, paddingBottom: 28 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: pass
            ? 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--success) 30%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--card), var(--bg))'
            : 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--danger) 22%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--card), var(--bg))',
        }} />
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 24px' }}>
          <div className="zd-pop" style={{
            width: 96, height: 96, borderRadius: 32, margin: '0 auto 18px',
            background: pass
              ? 'linear-gradient(135deg, var(--success), color-mix(in oklab, var(--success) 70%, #fff))'
              : 'linear-gradient(135deg, var(--danger), color-mix(in oklab, var(--danger) 70%, #fff))',
            display: 'grid', placeItems: 'center', color: '#fff',
            boxShadow: pass
              ? '0 14px 32px color-mix(in oklab, var(--success) 35%, transparent)'
              : '0 14px 32px color-mix(in oklab, var(--danger) 30%, transparent)',
          }}>
            {pass ? <AwardIcon size={56} stroke={1.8} /> : <CloseIcon size={48} stroke={2.4} />}
          </div>
          <div className="zd-eyebrow" style={{ color: pass ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: 13 }}>
            آزمون {fa(examNo)} تمام شد
          </div>
          <div className="zd-h1" style={{ marginTop: 6 }}>
            <span className="zd-num">{fa(correct)} از {fa(total)}</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 6 }}>
            {pass
              ? 'آفرین — این آزمون را با موفقیت قبول شدی.'
              : `${fa(SOURCE_EXAM_PASS - correct)} پاسخ درست دیگر تا نمرهٔ قبولی لازم داشتی.`}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 24px' }}>
        {/* Score bar */}
        <div className="zd-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="zd-eyebrow">{pass ? 'وضعیت: قبول' : 'وضعیت: قبول نشدی'}</div>
              <div className="zd-num" style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--ink)' }}>
                {fa(pct)}<span style={{ fontSize: 16 }}>٪</span>
              </div>
            </div>
            <ProgressRing value={pct} size={70} stroke={6} color={pass ? 'var(--success)' : 'var(--danger)'} bg="var(--line)">
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{pass ? 'قبول' : 'رد'}</div>
            </ProgressRing>
          </div>
          <div className="zd-bar" style={{ marginTop: 14 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pass ? 'var(--success)' : 'var(--danger)', borderRadius: 999, transition: 'width .8s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
            <span>۰</span>
            <span>قبولی: {fa(SOURCE_EXAM_PASS)}</span>
            <span>{fa(total)}</span>
          </div>
        </div>

        {/* Correct / wrong */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <StatCard label="پاسخ درست" value={fa(correct)} color="var(--success)" icon={CheckIcon} />
          <StatCard label="پاسخ اشتباه" value={fa(wrong)} color="var(--danger)" icon={CloseIcon} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          <button onClick={onReviewWrong} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 52 }}>
            <FlagIcon size={18} stroke={2.1} /> مرور اشتباهات
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRetry} className="zd-btn zd-btn-outline" style={{ flex: 1, height: 48 }}>
              <RefreshIcon size={17} stroke={2.1} /> تلاش دوباره
            </button>
            <button onClick={onBackToExams} className="zd-btn zd-btn-ghost" style={{ flex: 1, height: 48 }}>
              بازگشت به آزمون‌ها
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
