import React, { useMemo } from 'react'
import type { Category, Progress, Question } from '../types'
import type { ExamAttemptReadItem } from '../data/progress/repo'
import { ProgressRing } from '../components/ProgressRing'
import { StatCard } from '../components/StatCard'
import {
  CheckIcon, CloseIcon, BookmarkFilledIcon, TargetIcon, AwardIcon, TrophyIcon,
  FlagIcon, ShieldIcon, LockIcon, RefreshIcon,
} from '../components/Icons'
import { fa } from '../utils'

interface Props {
  progress: Progress
  categories: Category[]
  /** Combined review pool (generic + source exams) used to resolve wrong ids to categories. */
  questions: Question[]
  authed: boolean
  /** null = not loaded / unavailable / read failed; [] = loaded, no attempts yet. */
  attempts: ExamAttemptReadItem[] | null
  onStartExam?: () => void
  onOpenAccount?: () => void
}

const DAY_MS = 24 * 60 * 60 * 1000
/** Persian weekday initial, indexed by JS Date.getDay() (0 = Sunday). */
const WEEKDAY_LETTERS = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']

/** Simple percentage bar chart (0..100 absolute scale — bars are real score %). */
function WeekBarChart({ days }: { days: { label: string; pct: number }[] }) {
  return (
    <div className="flex items-end" style={{ gap: 8, height: 76 }}>
      {days.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center" style={{ gap: 6 }}>
          <div className="flex-1 w-full flex items-end">
            <div style={{
              width: '100%',
              height: `${Math.max(d.pct, 4)}%`,
              borderRadius: '8px 8px 4px 4px',
              background: d.pct > 0
                ? 'linear-gradient(180deg, var(--accent), var(--accent-deep))'
                : 'var(--line)',
              opacity: d.pct > 0 ? 1 : 0.6,
            }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

/**
 * Real Progress screen MVP (Phase 7J). Every number shown traces to real data:
 * exam stats, readiness ring, the 7-day trend, and badges come from cloud
 * examAttempts (authed, in-memory); mistake/bookmark counts and weak categories
 * come from local progress. Missing data is stated honestly, never faked.
 */
export function ProgressScreen({
  progress, categories, questions, authed, attempts, onStartExam, onOpenAccount,
}: Props) {
  const wrongCount    = progress.wrongQuestionIds.length
  const bookmarkCount = progress.bookmarked.length

  // ── Exam stats, derived from the loaded attempts (newest first) ──
  const examStats = useMemo(() => {
    if (!attempts || attempts.length === 0) return null
    // Defensive: order newest-first even if the read order ever changes.
    const sorted = [...attempts].sort((a, b) => (b.finishedAtMillis ?? 0) - (a.finishedAtMillis ?? 0))
    const latest = sorted[0]
    const best   = sorted.reduce((m, a) => (a.score > m.score ? a : m), sorted[0])
    const avg    = Math.round(sorted.reduce((s, a) => s + a.score, 0) / sorted.length)
    return { count: sorted.length, latest, best, avg }
  }, [attempts])

  // Readiness = best exam score as a percentage. Labeled honestly below.
  const readiness = examStats
    ? Math.round((examStats.best.score / examStats.best.totalQuestions) * 100)
    : 0
  const readyLabel = !examStats
    ? 'هنوز آزمونی ثبت نشده'
    : readiness >= 75 ? 'آمادهٔ آزمون' : readiness >= 50 ? 'مسیر خوبی داری' : 'هنوز نیاز به تمرین داری'
  const readyColor = readiness >= 75 ? 'var(--success)' : readiness >= 50 ? 'var(--accent)' : 'var(--warn)'

  // ── Last 7 days of exam scores (best score % per day, real dates) ──
  const week = useMemo(() => {
    if (!attempts || attempts.length === 0) return null
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const todayStart = start.getTime()
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayStart = todayStart - (6 - i) * DAY_MS
      const pct = attempts.reduce((best, a) => {
        if (a.finishedAtMillis === null) return best
        if (a.finishedAtMillis < dayStart || a.finishedAtMillis >= dayStart + DAY_MS) return best
        return Math.max(best, Math.round((a.score / a.totalQuestions) * 100))
      }, 0)
      return { label: WEEKDAY_LETTERS[new Date(dayStart).getDay()]!, pct }
    })
    const bestOfWeek = Math.max(...days.map(d => d.pct))
    return { days, bestOfWeek, hasData: bestOfWeek > 0 }
  }, [attempts])

  // ── Badges — unlocked only by real, verifiable activity ──
  const badges = useMemo(() => {
    const a = attempts ?? []
    return [
      { icon: FlagIcon,    label: 'اولین آزمون',  got: a.length >= 1,                                  color: 'var(--primary)' },
      { icon: AwardIcon,   label: 'قبولی اول',    got: a.some(x => x.passed),                          color: 'var(--success)' },
      { icon: ShieldIcon,  label: 'نمرهٔ کامل',    got: a.some(x => x.score === x.totalQuestions),      color: 'var(--accent-deep)' },
      { icon: TargetIcon,  label: '۵ آزمون',      got: a.length >= 5,                                  color: 'var(--accent)' },
      { icon: TrophyIcon,  label: '۱۰ آزمون',     got: a.length >= 10,                                 color: 'var(--primary)' },
      { icon: RefreshIcon, label: 'مرور فعال',    got: wrongCount > 0 || bookmarkCount > 0,            color: 'var(--danger)' },
    ]
  }, [attempts, wrongCount, bookmarkCount])

  // ── Weak categories: share of the wrong pool per category (real data) ──
  const weakCats = useMemo(() => {
    if (wrongCount === 0) return []
    const byId = new Map(questions.map(q => [q.id, q]))
    const counts = new Map<string, number>()
    let resolved = 0
    for (const id of progress.wrongQuestionIds) {
      const q = byId.get(id)
      if (!q) continue
      resolved++
      counts.set(q.cat, (counts.get(q.cat) ?? 0) + 1)
    }
    if (resolved === 0) return []
    return categories
      .map(c => ({ cat: c, count: counts.get(c.id) ?? 0 }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(e => ({ ...e, pct: Math.round((e.count / resolved) * 100) }))
  }, [progress.wrongQuestionIds, wrongCount, questions, categories])

  const nothingToReview = wrongCount === 0 && bookmarkCount === 0

  return (
    <div className="zd-scroll">
      {/* Header */}
      <div className="zd-header">
        <div className="zd-header-row"><div /><div /></div>
        <div style={{ marginTop: 6 }}>
          <div className="zd-eyebrow" style={{ marginBottom: 4 }}>بر اساس آزمون‌ها، اشتباهات و مرورهای واقعی</div>
          <div className="zd-h1">پیشرفت من</div>
        </div>
      </div>

      <div style={{ padding: '0 20px 24px' }}>
        {/* ── وضعیت آزمون (readiness ring — real best-exam score) ── */}
        {authed && attempts !== null && (
          <div className="zd-card flex items-center" style={{ padding: 22, gap: 18, marginBottom: 20 }}>
            <ProgressRing value={readiness} size={110} stroke={10} color={readyColor} bg="var(--line)">
              <div className="zd-num" style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
                {fa(readiness)}<span style={{ fontSize: 14 }}>٪</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>آمادگی</div>
            </ProgressRing>
            <div className="flex-1">
              <div className="zd-eyebrow" style={{ color: readyColor, fontWeight: 700 }}>وضعیت آزمون</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginTop: 4, lineHeight: 1.3 }}>
                {readyLabel}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.6 }}>
                {examStats
                  ? `بر اساس بهترین نمرهٔ آزمون: ${fa(examStats.best.score)} از ${fa(examStats.best.totalQuestions)}`
                  : 'برای تخمین آمادگی، یک آزمون انجام بده.'}
              </div>
            </div>
          </div>
        )}

        {/* ── کارنامهٔ آزمون‌ها ── */}
        <div className="zd-h2" style={{ marginBottom: 12 }}>کارنامهٔ آزمون‌ها</div>

        {!authed && (
          <div className="zd-card" style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
              برای ذخیره و دیدن نتیجهٔ آزمون‌ها وارد حساب شو
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.6 }}>
              نتیجهٔ هر آزمون به حسابت گره می‌خورد و روی هر دستگاهی همراهت است.
            </div>
            {onOpenAccount && (
              <button onClick={onOpenAccount} className="zd-btn zd-btn-primary" style={{ marginTop: 14, height: 44, padding: '0 22px' }}>
                ورود / ثبت‌نام
              </button>
            )}
          </div>
        )}

        {authed && attempts === null && (
          <div className="zd-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              نتایج آزمون‌ها فعلاً در دسترس نیست
            </div>
          </div>
        )}

        {authed && attempts !== null && attempts.length === 0 && (
          <div className="zd-card" style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>هنوز آزمونی ثبت نشده</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.6 }}>
              با اولین آزمون، کارنامه‌ات همین‌جا ساخته می‌شود.
            </div>
            {onStartExam && (
              <button onClick={onStartExam} className="zd-btn zd-btn-accent" style={{ marginTop: 14, height: 44, padding: '0 22px' }}>
                <FlagIcon size={16} stroke={2.1} /> شروع اولین آزمون
              </button>
            )}
          </div>
        )}

        {examStats && (
          <>
            <div className="flex" style={{ gap: 10 }}>
              <StatCard
                label="آزمون‌های انجام‌شده"
                value={fa(examStats.count)}
                color="var(--primary)"
                icon={TargetIcon}
              />
              <StatCard
                label="آخرین نمره"
                value={`${fa(examStats.latest.score)} از ${fa(examStats.latest.totalQuestions)}`}
                sub={examStats.latest.passed ? 'قبول' : 'مردود'}
                color={examStats.latest.passed ? 'var(--success)' : 'var(--danger)'}
                icon={examStats.latest.passed ? CheckIcon : CloseIcon}
              />
            </div>
            <div className="flex" style={{ gap: 10, marginTop: 10 }}>
              <StatCard
                label="بهترین نمره"
                value={`${fa(examStats.best.score)} از ${fa(examStats.best.totalQuestions)}`}
                sub={examStats.best.passed ? 'قبول' : 'مردود'}
                color={examStats.best.passed ? 'var(--success)' : 'var(--accent)'}
                icon={TrophyIcon}
              />
              <StatCard
                label="میانگین نمره‌ها"
                value={fa(examStats.avg)}
                sub={`در ${fa(examStats.count)} آزمون`}
                color="var(--accent)"
                icon={AwardIcon}
              />
            </div>

            {/* ── نمره‌های ۷ روز اخیر (real attempt dates and scores) ── */}
            {week && (
              <div className="zd-card" style={{ padding: 18, marginTop: 14 }}>
                <div className="flex justify-between items-baseline" style={{ marginBottom: 14 }}>
                  <div>
                    <div className="zd-eyebrow">نمره‌های ۷ روز اخیر</div>
                    {week.hasData && (
                      <div className="zd-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                        {fa(week.bestOfWeek)}<span style={{ fontSize: 13 }}>٪</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginRight: 6 }}>بهترین نمرهٔ هفته</span>
                      </div>
                    )}
                  </div>
                </div>
                {week.hasData ? (
                  <WeekBarChart days={week.days} />
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '12px 0', lineHeight: 1.6 }}>
                    در ۷ روز اخیر آزمونی ثبت نشده
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── مرور و نقاط ضعف ── */}
        <div className="zd-h2" style={{ marginTop: 20, marginBottom: 12 }}>مرور و نقاط ضعف</div>

        {nothingToReview ? (
          <div className="zd-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>هنوز چیزی برای مرور نیست</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.6 }}>
              به تمرین ادامه بده تا نقاط ضعف مشخص شوند.
            </div>
          </div>
        ) : (
          <>
            <div className="flex" style={{ gap: 10 }}>
              <StatCard
                label="سؤال‌های اشتباه"
                value={fa(wrongCount)}
                sub="برای مرور"
                color="var(--danger)"
                icon={CloseIcon}
              />
              <StatCard
                label="نشان‌شده"
                value={fa(bookmarkCount)}
                sub="برای مرور بعدی"
                color="var(--primary)"
                icon={BookmarkFilledIcon}
              />
            </div>

            {weakCats.length > 0 && (
              <div className="zd-card" style={{ padding: 14, marginTop: 14 }}>
                <div className="zd-eyebrow" style={{ padding: '4px 4px 8px' }}>بیشترین اشتباه‌ها در</div>
                {weakCats.map((e, i) => (
                  <div key={e.cat.id} className="flex items-center" style={{
                    gap: 12, padding: '12px 4px',
                    borderTop: i > 0 ? '1px solid var(--line)' : 'none',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                      background: `color-mix(in oklab, ${e.cat.color} 14%, transparent)`,
                      // 55% toward --tint-ink keeps the glyph identifiable in dark
                      // mode (raw cat colors drop to 1.6:1 there). Bar fill below
                      // stays raw by design — it is a fill, not a foreground.
                      color: `color-mix(in oklab, ${e.cat.color} 55%, var(--tint-ink))`, display: 'grid', placeItems: 'center',
                      fontWeight: 800, fontSize: 18,
                    }}>{e.cat.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline" style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{e.cat.title}</div>
                        <div className="zd-num" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                          {fa(e.count)} سؤال · {fa(e.pct)}٪
                        </div>
                      </div>
                      <div className="zd-bar">
                        <div className="zd-bar-fill" style={{
                          width: `${e.pct}%`,
                          background: `linear-gradient(90deg, ${e.cat.color}, color-mix(in oklab, ${e.cat.color} 60%, var(--accent)))`,
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: 'var(--ink-3)', padding: '8px 4px 2px', lineHeight: 1.6 }}>
                  سهم هر موضوع از کل سؤال‌های اشتباه تو
                </div>
              </div>
            )}
          </>
        )}

        {/* ── نشان‌های من (unlocked only by real activity) ── */}
        <div style={{ marginTop: 20 }}>
          <div className="zd-h2" style={{ marginBottom: 12 }}>نشان‌های من</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {badges.map(({ icon: Icon, label, got, color }, i) => (
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
