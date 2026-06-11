import React, { useMemo } from 'react'
import type { Category, Progress, Question } from '../types'
import type { ExamAttemptReadItem } from '../data/progress/repo'
import { StatCard } from '../components/StatCard'
import {
  CheckIcon, CloseIcon, BookmarkFilledIcon, TargetIcon, AwardIcon, TrophyIcon, FlagIcon,
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

/**
 * Real Progress screen MVP (Phase 7J). Every number shown traces to real data:
 * exam stats come from cloud examAttempts (authed, in-memory), mistake/bookmark
 * counts and weak categories come from local progress. No fake readiness,
 * streaks, charts, or achievements.
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
                      color: e.cat.color, display: 'grid', placeItems: 'center',
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
      </div>
    </div>
  )
}
