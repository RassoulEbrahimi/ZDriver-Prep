import React from 'react'
import { fa } from '../utils'
import { SOURCE_EXAM_PASS } from '../data/sourceExamBuilder'
import {
  ChevRightIcon, ShieldIcon, TrophyIcon, BookIcon, ClockIcon,
  AwardIcon, BulbIcon, ImageIcon, RefreshIcon, PlayIcon,
} from '../components/Icons'

interface Props {
  examNo: number
  onStart: () => void
  onBack: () => void
}

export function SourceExamStartScreen({ examNo, onStart, onBack }: Props) {
  const chips = [
    { icon: BookIcon,  label: '۳۰ سؤال' },
    { icon: ClockIcon, label: '۲۰ دقیقه' },
    { icon: AwardIcon, label: `نمره قبولی: ${fa(SOURCE_EXAM_PASS)} از ۳۰` },
  ]

  const expectations = [
    { icon: ClockIcon,   t: 'زمان‌بندی واقعی', s: 'تایمر از ۲۰:۰۰ شروع می‌شود؛ نگران نباش، می‌توانی متوقف کنی.' },
    { icon: ImageIcon,   t: 'سؤال‌های تصویری', s: 'برخی سؤال‌ها تصویر دارند که بالای متن سؤال نمایش داده می‌شود.' },
    { icon: RefreshIcon, t: 'مرور پس از آزمون', s: 'در پایان، پاسخ‌های درست و اشتباه را با هم می‌بینی.' },
  ]

  return (
    <div className="zd-scroll">
      {/* Dusk hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="zd-dusk-bg" />
        <div className="zd-fade-up" style={{ position: 'relative', padding: '54px 20px 30px' }}>
          <div className="zd-header-row" style={{ marginBottom: 22 }}>
            <button className="zd-icon-btn" onClick={onBack} aria-label="بازگشت"
              style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff' }}>
              <ChevRightIcon size={18} />
            </button>
            <span className="zd-chip" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}>
              <ShieldIcon size={13} stroke={2} /> آزمون رسمی آیین‌نامه
            </span>
            <div style={{ width: 40 }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 84, height: 84, borderRadius: 26, margin: '0 auto 16px',
              background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)',
              display: 'grid', placeItems: 'center', color: '#fff',
              backdropFilter: 'blur(8px)',
            }}>
              <TrophyIcon size={40} stroke={1.7} />
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>آمادهٔ شروع</div>
            <div className="zd-num" style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginTop: 4 }}>آزمون {fa(examNo)}</div>
          </div>
        </div>
      </div>

      <div className="zd-fade-up" style={{ padding: '20px 20px 24px' }}>
        {/* Summary chips as cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {chips.map((c, i) => {
            const Icon = c.icon
            return (
              <div key={i} className="zd-card" style={{
                padding: '14px 8px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8, textAlign: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: 'var(--primary-soft)', color: 'var(--primary)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon size={18} stroke={2} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4 }}>{c.label}</div>
              </div>
            )
          })}
        </div>

        {/* Supportive text */}
        <div className="zd-card" style={{
          marginTop: 14, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start',
          background: 'color-mix(in oklab, var(--accent) 7%, var(--card))',
          border: '1px solid color-mix(in oklab, var(--accent) 22%, transparent)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: 'color-mix(in oklab, var(--accent) 20%, transparent)',
            color: 'var(--accent-deep)', display: 'grid', placeItems: 'center',
          }}>
            <BulbIcon size={17} />
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.7 }}>
            وقتی آماده‌ای، آزمون را شروع کن. می‌توانی بعداً دوباره همین آزمون را تمرین کنی.
          </div>
        </div>

        {/* What to expect */}
        <div style={{ marginTop: 18 }}>
          {expectations.map((r, i) => {
            const Icon = r.icon
            return (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 2px',
                borderTop: i > 0 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'var(--bg-deeper)', color: 'var(--ink-2)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon size={16} stroke={2} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{r.t}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.6 }}>{r.s}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <button onClick={onStart} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 54, fontSize: 16 }}>
            <PlayIcon size={17} stroke={2.4} />
            شروع آزمون
          </button>
          <button onClick={onBack} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 48, fontSize: 14 }}>
            بازگشت به لیست آزمون‌ها
          </button>
        </div>
      </div>
    </div>
  )
}
