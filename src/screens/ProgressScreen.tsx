import React from 'react'
import type { Category, Progress } from '../types'
import { ProgressRing } from '../components/ProgressRing'
import { StatCard } from '../components/StatCard'
import { CheckIcon, CloseIcon, FireIcon, BookmarkFilledIcon, TargetIcon, AwardIcon, ShieldIcon, LockIcon } from '../components/Icons'
import { fa } from '../utils'

interface Props {
  progress: Progress
  categories: Category[]
}

const BAR_VALUES  = [58, 64, 72, 68, 75, 80, 84]
const BAR_LABELS  = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

function BarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values)
  return (
    <div className="flex items-end" style={{ gap: 8, height: 76 }}>
      {values.map((v, i) => {
        const h      = (v / max) * 100
        const isLast = i === values.length - 1
        return (
          <div key={i} className="flex-1 flex flex-col items-center" style={{ gap: 6 }}>
            <div className="flex-1 w-full flex items-end">
              <div style={{
                width: '100%', height: `${h}%`,
                borderRadius: '8px 8px 4px 4px',
                background: isLast
                  ? 'linear-gradient(180deg, var(--accent), var(--accent-deep))'
                  : 'linear-gradient(180deg, var(--grad-via), color-mix(in oklab, var(--grad-via) 60%, var(--accent)))',
                opacity: isLast ? 1 : 0.85,
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{labels[i]}</div>
          </div>
        )
      })}
    </div>
  )
}

export function ProgressScreen({ progress, categories }: Props) {
  const readiness   = progress.examReadiness
  const readyLabel  = readiness >= 75 ? 'آمادهٔ آزمون' : readiness >= 50 ? 'مسیر خوبی داری' : 'هنوز نیاز به تمرین داری'
  const readyColor  = readiness >= 75 ? 'var(--success)'  : readiness >= 50 ? 'var(--accent)' : 'var(--warn)'

  const achievements = [
    { icon: FireIcon,         label: '۵ روز پشت سر هم',    got: true,  color: 'var(--accent)' },
    { icon: AwardIcon,        label: 'اولین موضوع کامل',   got: true,  color: 'var(--primary)' },
    { icon: TargetIcon,       label: '۱۰۰ پاسخ درست',      got: false, color: 'var(--success)' },
    { icon: ShieldIcon,       label: 'نمرهٔ کامل',          got: false, color: 'var(--ink-3)' },
  ]

  return (
    <div className="zd-scroll">
      {/* Header */}
      <div className="zd-header">
        <div className="zd-header-row"><div /><div /></div>
        <div style={{ marginTop: 6 }}>
          <div className="zd-eyebrow" style={{ marginBottom: 4 }}>تصویری از وضعیت یادگیری</div>
          <div className="zd-h1">پیشرفت من</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Readiness hero */}
        <div className="zd-card flex items-center" style={{ padding: 22, gap: 18 }}>
          <ProgressRing value={readiness} size={110} stroke={10} color={readyColor} bg="var(--line)">
            <div className="zd-num" style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
              {fa(readiness)}<span style={{ fontSize: 14 }}>٪</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>آمادگی</div>
          </ProgressRing>
          <div className="flex-1">
            <div className="zd-eyebrow" style={{ color: readyColor, fontWeight: 700 }}>وضعیت آزمون</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginTop: 4, lineHeight: 1.3 }}>{readyLabel}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.6 }}>
              تخمین آمادگی بر اساس درصد پاسخ‌های درست و موضوعات کامل‌شده
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex" style={{ gap: 10, marginTop: 14 }}>
          <StatCard label="پاسخ درست"   value={fa(progress.correct)}              sub={`از ${fa(progress.answered)}`} color="var(--success)"  icon={CheckIcon} />
          <StatCard label="پاسخ اشتباه" value={fa(progress.wrong)}                sub="نیاز به مرور"                  color="var(--danger)"   icon={CloseIcon} />
        </div>
        <div className="flex" style={{ gap: 10, marginTop: 10 }}>
          <StatCard label="نوبت متوالی" value={`${fa(progress.streakDays)} روز`} sub="استمرار خوب"                    color="var(--accent)"   icon={FireIcon} />
          <StatCard label="نشان‌شده"    value={fa(progress.bookmarked.length)}   sub="برای مرور بعدی"                 color="var(--primary)"  icon={BookmarkFilledIcon} />
        </div>

        {/* Accuracy trend */}
        <div className="zd-card" style={{ padding: 18, marginTop: 14 }}>
          <div className="flex justify-between items-baseline" style={{ marginBottom: 14 }}>
            <div>
              <div className="zd-eyebrow">دقت در ۷ روز اخیر</div>
              <div className="zd-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                {fa(80)}<span style={{ fontSize: 13 }}>٪</span>
              </div>
            </div>
            <span className="zd-chip zd-chip-success">+۶٪ این هفته</span>
          </div>
          <BarChart values={BAR_VALUES} labels={BAR_LABELS} />
        </div>

        {/* Category breakdown */}
        <div style={{ marginTop: 20 }}>
          <div className="zd-h2" style={{ marginBottom: 12 }}>پیشرفت موضوعی</div>
          <div className="zd-card" style={{ padding: 14 }}>
            {categories.map((c, i) => {
              const pct = Math.round((c.done / c.total) * 100)
              return (
                <div key={c.id} className="flex items-center" style={{
                  gap: 12, padding: '12px 4px',
                  borderTop: i > 0 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: `color-mix(in oklab, ${c.color} 14%, transparent)`,
                    color: c.color, display: 'grid', placeItems: 'center',
                    fontWeight: 800, fontSize: 18,
                  }}>{c.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline" style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{c.title}</div>
                      <div className="zd-num" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {fa(c.done)}/{fa(c.total)}
                      </div>
                    </div>
                    <div className="zd-bar">
                      <div className="zd-bar-fill" style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${c.color}, color-mix(in oklab, ${c.color} 60%, var(--accent)))`,
                      }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Achievements */}
        <div style={{ marginTop: 20 }}>
          <div className="zd-h2" style={{ marginBottom: 12 }}>نشان‌های من</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {achievements.map(({ icon: Icon, label, got, color }, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '12px 6px', borderRadius: 16,
                background: got ? 'var(--card)' : 'var(--bg-deeper)',
                border: '1px solid var(--line)',
                opacity: got ? 1 : 0.55,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, margin: '0 auto',
                  background: got ? `color-mix(in oklab, ${color} 16%, transparent)` : 'var(--line)',
                  color: got ? color : 'var(--ink-4)',
                  display: 'grid', placeItems: 'center', marginBottom: 6,
                }}>
                  {got ? <Icon size={22} /> : <LockIcon size={18} />}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
