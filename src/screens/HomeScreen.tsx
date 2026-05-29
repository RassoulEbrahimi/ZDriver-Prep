import React, { useState } from 'react'
import type { Category, Progress } from '../types'
import { ProgressRing } from '../components/ProgressRing'
import { JourneyPath }  from '../components/JourneyPath'
import { BellIcon, SettingsIcon, FireIcon, CheckIcon, CloseIcon, TrophyIcon, ChevLeftIcon, PlayIcon, BulbIcon, VideoIcon } from '../components/Icons'
import { VideoGallery } from '../components/VideoGallery'
import { VideoPlayer }  from '../components/VideoPlayer'
import { VIDEOS } from '../videos'
import type { VideoEntry } from '../videos'
import { fa } from '../utils'

interface Props {
  progress: Progress
  categories: Category[]
  onContinue: () => void
  onPickCategory: (cat: Category) => void
  onStartExam: () => void
}

const pillBtn: React.CSSProperties = {
  position: 'relative',
  width: 38, height: 38, borderRadius: 12,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  display: 'grid', placeItems: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
}

export function HomeScreen({ progress, categories, onContinue, onPickCategory, onStartExam }: Props) {
  const pct = Math.round((progress.answered / progress.totalQuestions) * 100)

  const [showGallery, setShowGallery] = useState(false)
  const [activeVideo, setActiveVideo] = useState<VideoEntry | null>(null)

  const miniStats = [
    { icon: FireIcon,  value: `${fa(progress.streakDays)} روز`, label: 'نوبت متوالی' },
    { icon: CheckIcon, value: fa(progress.correct),              label: 'پاسخ درست' },
    { icon: CloseIcon, value: fa(progress.wrong),                label: 'اشتباه' },
  ]

  return (
    <>
    <div className="zd-scroll">
      {/* ── Dusk hero ── */}
      <div className="relative overflow-hidden">
        <div className="zd-dusk-bg" />

        {/* Decorative stars */}
        <div className="absolute inset-0 pointer-events-none">
          {([[40,80,2],[200,60,1.5],[320,120,2.5],[80,170,1.5],[280,190,2],[160,40,1.2]] as [number,number,number][]).map(([x,y,r], i) => (
            <div key={i} className="absolute rounded-full" style={{ left: x, top: y, width: r*2, height: r*2, background: '#fff', opacity: 0.5 }} />
          ))}
        </div>

        <div className="relative" style={{ padding: '54px 20px 28px' }}>
          {/* Top row */}
          <div className="flex justify-between items-center" style={{ marginBottom: 18 }}>
            <div className="flex items-center" style={{ gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 14,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'grid', placeItems: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14,
                backdropFilter: 'blur(10px)',
              }}>ز</div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>سلام،</div>
                <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>زهرا</div>
              </div>
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <button aria-label="آموزش تصویری" style={pillBtn} onClick={() => setShowGallery(true)}>
                <VideoIcon size={18} color="#fff" />
              </button>
              <button aria-label="اعلان‌ها" style={pillBtn}>
                <BellIcon size={18} color="#fff" />
                <span style={{
                  position: 'absolute', top: 8, left: 8,
                  width: 8, height: 8, borderRadius: 99,
                  background: 'var(--accent)', border: '1.5px solid var(--grad-via)',
                }} />
              </button>
              <button aria-label="تنظیمات" style={pillBtn}>
                <SettingsIcon size={18} color="#fff" />
              </button>
            </div>
          </div>

          {/* Hero: ring + headline */}
          <div className="flex items-center" style={{ gap: 18, marginTop: 6 }}>
            <ProgressRing value={pct} size={108} stroke={9} color="var(--accent)" bg="rgba(255,255,255,0.18)">
              <div className="zd-num" style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {fa(pct)}<span style={{ fontSize: 14, marginRight: 2 }}>٪</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>آمادگی کلی</div>
            </ProgressRing>

            <div className="flex-1">
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 6 }}>
                ادامهٔ مسیر یادگیری
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55 }}>
                {fa(progress.answered)} از {fa(progress.totalQuestions)} سؤال
                {' · '}
                {fa(progress.daysToExam)} روز تا آزمون
              </div>
              <button className="zd-btn zd-btn-accent" style={{ marginTop: 12, height: 42, padding: '0 18px', fontSize: 14 }}
                      onClick={onContinue}>
                <PlayIcon size={14} stroke={2.4} />
                ادامه دادن
              </button>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex" style={{ gap: 8, marginTop: 20 }}>
            {miniStats.map(({ icon: Icon, value, label }, i) => (
              <div key={i} className="flex-1" style={{
                borderRadius: 16, padding: '10px 12px',
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.14)',
                backdropFilter: 'blur(8px)',
              }}>
                <div className="flex items-center" style={{ gap: 6, color: 'var(--accent-warm)', marginBottom: 4 }}>
                  <Icon size={14} stroke={2.2} />
                  <div className="zd-num" style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{value}</div>
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Exam shortcut ── */}
      <div style={{ padding: '18px 20px 4px' }}>
        <button onClick={onStartExam} className="zd-card" style={{
          width: '100%', padding: 16, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--card)', textAlign: 'right',
          fontFamily: 'var(--font)', borderRadius: 18,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
            display: 'grid', placeItems: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <TrophyIcon size={26} stroke={1.9} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>شبیه‌ساز آزمون رسمی</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>۳۰ سؤال · ۲۰ دقیقه · امتیاز قبولی ۲۵</div>
          </div>
          <ChevLeftIcon size={18} color="var(--ink-3)" stroke={2.2} />
        </button>
      </div>

      {/* ── Tip of the day ── */}
      <div style={{ padding: '12px 20px 4px' }}>
        <div className="zd-card" style={{
          padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start',
          background: 'color-mix(in oklab, var(--accent) 8%, var(--card))',
          border: '1px solid color-mix(in oklab, var(--accent) 24%, transparent)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'color-mix(in oklab, var(--accent) 22%, transparent)',
            color: 'var(--accent-deep)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <BulbIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>نکتهٔ روز</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.6 }}>
              فاصلهٔ ایمن از خودروی جلویی را با قانون «دو ثانیه» تخمین بزن؛ روی جادهٔ خیس این فاصله را دو برابر کن.
            </div>
          </div>
        </div>
      </div>

      {/* ── Journey path ── */}
      <div style={{ padding: '24px 20px 8px' }}>
        <div className="flex justify-between items-baseline" style={{ marginBottom: 4 }}>
          <div className="zd-h2">مسیر یادگیری</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>۵ موضوع</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>
          هر گره یک موضوع است — برای ورود لمس کن
        </div>
      </div>
      <div style={{ padding: '0 8px' }}>
        <JourneyPath categories={categories} onPick={onPickCategory} />
      </div>
    </div>

    {showGallery && (
      <VideoGallery
        videos={VIDEOS}
        onSelect={v => setActiveVideo(v)}
        onClose={() => setShowGallery(false)}
      />
    )}
    {activeVideo && (
      <VideoPlayer
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    )}
    </>
  )
}
