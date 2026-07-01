import React, { useState, useMemo } from 'react'
import type { Category, Progress } from '../types'
import type { ExamAttemptReadItem } from '../data/progress/repo'
import { ProgressRing } from '../components/ProgressRing'
import { JourneyPath }  from '../components/JourneyPath'
import { SettingsIcon, CloseIcon, TrophyIcon, ChevLeftIcon, PlayIcon, BulbIcon, VideoIcon, BookIcon, FlagIcon, BookmarkFilledIcon, UserIcon } from '../components/Icons'
import { VideoGallery } from '../components/VideoGallery'
import { VideoPlayer }  from '../components/VideoPlayer'
import { SubscriptionBadge } from '../components/SubscriptionBadge'
import { useAuth }      from '../auth/useAuth'
import { VIDEOS } from '../videos'
import type { VideoEntry } from '../videos'
import { fa } from '../utils'

interface Props {
  progress: Progress
  categories: Category[]
  /** Recent cloud exam attempts; null = not loaded / unavailable / guest. */
  attempts: ExamAttemptReadItem[] | null
  onContinue: () => void
  onPickCategory: (cat: Category) => void
  onPractice: () => void
  onExam: () => void
  onReviewMistakes: () => void
  onOpenSettings: () => void
  onOpenAccount: () => void
}

// نکتهٔ روز — rotated by day-of-year, no persistence. All tips state real
// آیین‌نامه rules consistent with the question bank's explanations.
const DAILY_TIPS = [
  'فاصلهٔ ایمن از خودروی جلویی را با قانون «دو ثانیه» تخمین بزن؛ روی جادهٔ خیس این فاصله را دو برابر کن.',
  'در گذرگاه پیادهٔ بدون چراغ راهنمایی، حق تقدم همیشه با عابر پیاده است؛ سرعت را کم کن و آمادهٔ توقف باش.',
  'در تقاطع هم‌عرض بدون علائم، حق تقدم با وسیله‌ای است که در سمت راست تو قرار دارد.',
  'سبقت گرفتن در تونل‌ها و روی پل‌ها ممنوع است و تنها پس از پایان آن‌ها آزاد می‌شود.',
  'شب‌ها وقتی خودرویی از روبه‌رو نزدیک می‌شود و فاصله به ۱۵۰ متر یا کمتر رسید، نور بالا را به نور پایین تبدیل کن.',
  'هنگام عبور از تقاطع ریلی هم‌سطح، روی ریل هرگز دنده عوض نکن؛ با دندهٔ مناسب و ثابت عبور کن.',
  'در پنچری ناگهانی، فرمان را محکم نگه دار و بدون ترمز شدید اجازه بده خودرو به‌تدریج متوقف شود.',
] as const

function tipOfTheDay(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000)
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length]!
}

const pillBtn: React.CSSProperties = {
  position: 'relative',
  width: 44, height: 44, borderRadius: 14,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  display: 'grid', placeItems: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
}

export function HomeScreen({ progress, categories, attempts, onContinue, onPickCategory, onPractice, onExam, onReviewMistakes, onOpenSettings, onOpenAccount }: Props) {
  const hasMistakes = progress.wrongQuestionIds.length > 0
  // Any real activity yet? Drives the hero CTA copy: «ادامه دادن» (resume) only
  // makes sense once there's something to resume; a brand-new user sees «شروع تمرین».
  const hasActivity = hasMistakes || progress.bookmarked.length > 0 || (attempts !== null && attempts.length > 0)

  const { status, user } = useAuth()
  const authed = status === 'authed' && !!user
  const avatarChar = authed && user?.email ? user.email[0]!.toUpperCase() : ''

  const [showGallery, setShowGallery] = useState(false)
  const [activeVideo, setActiveVideo] = useState<VideoEntry | null>(null)

  // Readiness = best real exam score (Phase 7K). null = no attempt to show —
  // the ring then states that honestly instead of faking a 0% progress value.
  const readiness = useMemo(() => {
    if (!attempts || attempts.length === 0) return null
    const best = attempts.reduce((m, a) =>
      a.score / a.totalQuestions > m.score / m.totalQuestions ? a : m, attempts[0])
    return Math.round((best.score / best.totalQuestions) * 100)
  }, [attempts])

  // Authed user whose attempts loaded as empty — suggest the first exam.
  const noAttemptsYet = authed && attempts !== null && attempts.length === 0

  const miniStats = [
    { icon: TrophyIcon,         value: attempts !== null ? fa(attempts.length) : '—', label: 'آزمون انجام‌شده' },
    { icon: CloseIcon,          value: fa(progress.wrongQuestionIds.length),          label: 'برای مرور' },
    { icon: BookmarkFilledIcon, value: fa(progress.bookmarked.length),                label: 'نشان‌شده' },
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

        <div className="relative" style={{ padding: 'var(--zd-safe-top) 20px 28px' }}>
          {/* Top row */}
          <div className="flex justify-between items-center" style={{ marginBottom: 18 }}>
            <button onClick={onOpenAccount} aria-label="حساب کاربری" className="flex items-center"
              style={{ gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', padding: 0, textAlign: 'right' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 14,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'grid', placeItems: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14,
                backdropFilter: 'blur(10px)',
              }}>{authed ? avatarChar : <UserIcon size={18} color="#fff" />}</div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)' }}>{authed ? 'حساب من' : 'سلام،'}</div>
                {authed ? (
                  <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>
                    {user?.email}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>مهمان</div>
                    <div style={{ fontSize: 11.5, color: 'var(--accent-warm)', fontWeight: 700, marginTop: 1 }}>ورود / ثبت‌نام</div>
                  </>
                )}
              </div>
            </button>
            <div className="flex" style={{ gap: 8 }}>
              <button aria-label="آموزش تصویری" style={pillBtn} onClick={() => setShowGallery(true)}>
                <VideoIcon size={18} color="#fff" />
              </button>
              <button aria-label="تنظیمات" style={pillBtn} onClick={onOpenSettings}>
                <SettingsIcon size={18} color="#fff" />
              </button>
            </div>
          </div>

          {/* Hero: ring + headline */}
          <div className="flex items-center" style={{ gap: 18, marginTop: 6 }}>
            <ProgressRing value={readiness ?? 0} size={108} stroke={9} color="var(--accent)" bg="rgba(255,255,255,0.18)">
              {readiness !== null ? (
                <>
                  <div className="zd-num" style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {fa(readiness)}<span style={{ fontSize: 14, marginRight: 2 }}>٪</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.88)', marginTop: 2 }}>بر اساس بهترین آزمون</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.88)', marginTop: 4, lineHeight: 1.5, padding: '0 8px', textAlign: 'center' }}>
                    هنوز آزمونی ثبت نشده
                  </div>
                </>
              )}
            </ProgressRing>

            <div className="flex-1">
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 6 }}>
                مسیر آزمون رانندگی
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 1.55 }}>
                ۱۷ آزمون رسمی + مرور تکمیلی
              </div>
              <button className="zd-btn zd-btn-accent" style={{ marginTop: 12, height: 42, padding: '0 18px', fontSize: 14 }}
                      onClick={onContinue}>
                <PlayIcon size={14} stroke={2.4} />
                {hasActivity ? 'ادامه دادن' : 'شروع تمرین'}
              </button>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex" style={{ gap: 10, marginTop: 20 }}>
            {miniStats.map(({ icon: Icon, value, label }, i) => (
              <div key={i} className="flex-1" style={{
                borderRadius: 16, padding: '10px 12px',
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.14)',
                backdropFilter: 'blur(8px)',
              }}>
                <div className="flex items-center" style={{ gap: 6, color: 'var(--accent-warm)', marginBottom: 4 }}>
                  <Icon size={14} stroke={2.2} />
                  <div className="zd-num" style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{value}</div>
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.9)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Subscription status (display only — no gating/paywall, Phase S2) ── */}
      <div style={{ padding: '14px 20px 0' }}>
        <SubscriptionBadge onOpenAccount={onOpenAccount} />
      </div>

      {/* ── Guest hint: results only persist with an account ── */}
      {!authed && (
        <div style={{ padding: '14px 20px 0' }}>
          <button onClick={onOpenAccount} className="zd-card" style={{
            width: '100%', padding: '12px 16px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'color-mix(in oklab, var(--primary) 8%, var(--card))',
            textAlign: 'right', fontFamily: 'var(--font)', borderRadius: 16,
          }}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.6 }}>
              برای ذخیرهٔ نتیجه‌ها وارد حساب شو
            </div>
            <ChevLeftIcon size={16} color="var(--primary)" stroke={2.4} />
          </button>
        </div>
      )}

      {/* ── گام بعدی تو (recommendation) ── */}
      <div style={{ padding: '18px 20px 4px' }}>
        <div className="zd-h2" style={{ marginBottom: 10 }}>گام بعدی تو</div>
        <button onClick={noAttemptsYet ? onExam : hasMistakes ? onReviewMistakes : onPractice} className="zd-card" style={{
          width: '100%', padding: 16, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--card)', textAlign: 'right',
          fontFamily: 'var(--font)', borderRadius: 18,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: noAttemptsYet
              ? 'linear-gradient(135deg, var(--accent-deep), var(--accent))'
              : hasMistakes
                ? 'linear-gradient(135deg, var(--danger), var(--accent-deep))'
                : 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'grid', placeItems: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            {noAttemptsYet ? <TrophyIcon size={24} stroke={1.9} /> : hasMistakes ? <FlagIcon size={24} stroke={1.9} /> : <PlayIcon size={24} stroke={1.9} />}
          </div>
          <div className="flex-1">
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {noAttemptsYet ? 'اولین آزمون را شروع کن' : hasMistakes ? 'مرور اشتباهات' : 'ادامه تمرین'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.55 }}>
              {noAttemptsYet
                ? 'یک آزمون واقعی بده تا نقطهٔ شروعت مشخص شود.'
                : hasMistakes
                  ? `${fa(progress.wrongQuestionIds.length)} سؤال برای مرور داری؛ بیا اشتباه‌ها را برطرف کنیم.`
                  : 'یک آزمون را برای تمرین انتخاب کن و یادگیری را ادامه بده.'}
            </div>
          </div>
          <ChevLeftIcon size={18} color="var(--ink-3)" stroke={2.2} />
        </button>
      </div>

      {/* ── چه کار می‌خواهی بکنی؟ (Practice vs Exam decision) ── */}
      <div style={{ padding: '18px 20px 4px' }}>
        <div className="zd-h2" style={{ marginBottom: 12 }}>چه کار می‌خواهی بکنی؟</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {/* تمرین */}
          <button onClick={onPractice} className="zd-card" style={{
            padding: '16px 16px 20px', border: 'none', cursor: 'pointer', textAlign: 'right',
            fontFamily: 'var(--font)', borderRadius: 18, background: 'var(--card)',
            display: 'flex', flexDirection: 'column', gap: 10, minHeight: 136,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'var(--primary-soft)', color: 'var(--primary)',
              display: 'grid', placeItems: 'center',
            }}>
              <BookIcon size={24} stroke={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>تمرین</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.6 }}>
                یادگیری، پاسخ فوری، بدون زمان
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              شروع <ChevLeftIcon size={15} stroke={2.4} />
            </div>
          </button>

          {/* آزمون */}
          <button onClick={onExam} className="zd-card" style={{
            padding: '16px 16px 20px', border: 'none', cursor: 'pointer', textAlign: 'right',
            fontFamily: 'var(--font)', borderRadius: 18, background: 'var(--card)',
            display: 'flex', flexDirection: 'column', gap: 10, minHeight: 136,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'color-mix(in oklab, var(--accent) 16%, transparent)', color: 'var(--accent-deep)',
              display: 'grid', placeItems: 'center',
            }}>
              <TrophyIcon size={24} stroke={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>آزمون</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.6 }}>
                شبیه‌سازی واقعی، با زمان، نتیجه در پایان
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>
              شروع <ChevLeftIcon size={15} stroke={2.4} />
            </div>
          </button>
        </div>
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
            background: 'color-mix(in oklab, var(--accent) 30%, transparent)',
            color: 'var(--accent-deep)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <BulbIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>نکتهٔ روز</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.6 }}>
              {tipOfTheDay()}
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
