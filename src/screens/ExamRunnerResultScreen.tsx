import React, { useState } from 'react'
import type { SourceExamResult } from '../types'
import { ProgressRing } from '../components/ProgressRing'
import { StatCard } from '../components/StatCard'
import { AwardIcon, CloseIcon, CheckIcon, FlagIcon, RefreshIcon, ChevRightIcon, BulbIcon, ImageIcon } from '../components/Icons'
import { QuestionImagePlaceholder } from '../components/QuestionImagePlaceholder'
import { fa } from '../utils'
import { getExamMeta } from '../data/examRegistry'

const OPT_LETTERS = ['الف', 'ب', 'ج', 'د']

interface Props {
  result: SourceExamResult
  onReviewWrong: () => void
  onRetry: () => void
  onBackToExams: () => void
}

/** Final exam result (آزمون). Shown only at the end of a timed run. Pass mark and
 *  framing come from the registry, so Exam 18 uses its derived threshold and a
 *  supplementary (non-official) label rather than the official 26/30. */
export function ExamRunnerResultScreen({ result, onReviewWrong, onRetry, onBackToExams }: Props) {
  const { examNo, correct, total } = result
  const meta  = getExamMeta(examNo)
  const pass  = meta?.passThreshold ?? Math.ceil(total * 26 / 30)
  const official = meta?.official ?? true
  const title = meta?.title ?? `آزمون ${fa(examNo)}`
  const passed = correct >= pass
  const pct    = Math.round((correct / total) * 100)
  const wrong  = total - correct

  // ── Session-only answer-sheet review (read-only). Everything derives from the
  // in-memory `result`; tapping a square shows that question with the user's
  // original answer, the correct answer, and the explanation. It never writes
  // progress, mistakes, bookmarks, scoring, cloud data, or the result itself. ──
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  if (reviewIndex !== null) {
    return <ExamAnswerReview result={result} index={reviewIndex} onBack={() => setReviewIndex(null)} />
  }

  return (
    <div className="zd-scroll">
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 'calc(var(--zd-safe-top) + 42px)', paddingBottom: 28 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: passed
            ? 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--success) 30%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--card), var(--bg))'
            : 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--danger) 22%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--card), var(--bg))',
        }} />
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 24px' }}>
          <div className="zd-pop" style={{
            width: 96, height: 96, borderRadius: 32, margin: '0 auto 18px',
            background: passed
              ? 'linear-gradient(135deg, var(--success), color-mix(in oklab, var(--success) 70%, #fff))'
              : 'linear-gradient(135deg, var(--danger), color-mix(in oklab, var(--danger) 70%, #fff))',
            display: 'grid', placeItems: 'center', color: '#fff',
            boxShadow: passed
              ? '0 14px 32px color-mix(in oklab, var(--success) 35%, transparent)'
              : '0 14px 32px color-mix(in oklab, var(--danger) 30%, transparent)',
          }}>
            {passed ? <AwardIcon size={56} stroke={1.8} /> : <CloseIcon size={48} stroke={2.4} />}
          </div>
          <div className="zd-eyebrow" style={{ color: passed ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: 13 }}>
            {official ? `${title} تمام شد` : `${title} — تمام شد`}
          </div>
          <div className="zd-h1" style={{ marginTop: 6 }}>
            <span className="zd-num">{fa(correct)} از {fa(total)}</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 6 }}>
            {passed
              ? (official ? 'آفرین — این آزمون را با موفقیت قبول شدی.' : 'آفرین — این مرور را با موفقیت گذراندی.')
              : `${fa(pass - correct)} پاسخ درست دیگر تا حد قبولی لازم داشتی.`}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 24px' }}>
        {/* Score bar */}
        <div className="zd-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="zd-eyebrow">{passed ? 'وضعیت: قبول' : 'وضعیت: قبول نشدی'}</div>
              <div className="zd-num" style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--ink)' }}>
                {fa(pct)}<span style={{ fontSize: 16 }}>٪</span>
              </div>
            </div>
            <ProgressRing value={pct} size={70} stroke={6} color={passed ? 'var(--success)' : 'var(--danger)'} bg="var(--line)">
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{passed ? 'قبول' : 'رد'}</div>
            </ProgressRing>
          </div>
          <div className="zd-bar" style={{ marginTop: 14 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: passed ? 'var(--success)' : 'var(--danger)', borderRadius: 999, transition: 'width .8s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
            <span>۰</span>
            <span>قبولی: {fa(pass)}</span>
            <span>{fa(total)}</span>
          </div>
        </div>

        {/* Correct / wrong */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <StatCard label="پاسخ درست" value={fa(correct)} color="var(--success)" icon={CheckIcon} />
          <StatCard label="پاسخ اشتباه" value={fa(wrong)} color="var(--danger)" icon={CloseIcon} />
        </div>

        {/* Answer sheet — one square per question; tap to review (read-only) */}
        <div className="zd-card" style={{ padding: 16, marginTop: 12 }}>
          <div className="zd-eyebrow" style={{ marginBottom: 12 }}>پاسخ‌برگ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {result.exam.map((q, i) => {
              const ua = result.answers[i]
              const ok = ua === q.answer
              const answered = ua !== null
              const label = `سؤال ${fa(i + 1)} — ${ok ? 'پاسخ درست' : answered ? 'پاسخ نادرست' : 'بدون پاسخ'}؛ برای بازبینی لمس کنید`
              return (
                <button
                  key={q.id}
                  onClick={() => setReviewIndex(i)}
                  aria-label={label}
                  title={label}
                  className="zd-num"
                  style={{
                    position: 'relative',
                    aspectRatio: '1', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font)', fontWeight: 800, fontSize: 14, color: '#fff',
                    background: ok ? 'var(--success)' : 'var(--danger)',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  {/* Non-color status cue in the top-start corner: check (correct),
                      cross (wrong), dash (unanswered). aria-hidden — the button's
                      aria-label already states the status in words. */}
                  <span aria-hidden="true" style={{
                    position: 'absolute', top: 3, insetInlineStart: 3,
                    display: 'grid', placeItems: 'center', opacity: 0.92,
                  }}>
                    {ok
                      ? <CheckIcon size={9} color="#fff" stroke={3} />
                      : answered
                        ? <CloseIcon size={9} color="#fff" stroke={3} />
                        : <span style={{ display: 'block', width: 6, height: 2, borderRadius: 1, background: '#fff' }} />}
                  </span>
                  {fa(i + 1)}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11.5, color: 'var(--ink-3)', justifyContent: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--success)' }} /> درست
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--danger)' }} /> نادرست یا بی‌پاسخ
            </span>
          </div>
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

/**
 * Read-only review of a single finished-exam question (answer-sheet tap target).
 * Pure display: shows the user's original answer, the correct answer, and the
 * explanation from the in-memory result. No re-answering, no progress/mistakes/
 * bookmark/cloud writes — nothing here mutates state beyond returning to the sheet.
 */
function ExamAnswerReview({ result, index, onBack }: { result: SourceExamResult; index: number; onBack: () => void }) {
  const total   = result.exam.length
  const q       = result.exam[index]
  const userAns = result.answers[index]
  const answered = userAns !== null
  const isCorrect = userAns === q.answer

  function optClass(i: number): string {
    if (i === q.answer) return 'zd-option is-correct'
    if (answered && i === userAns) return 'zd-option is-wrong'
    return 'zd-option'
  }

  return (
    <div className="zd-scroll" style={{ background: 'var(--bg-deeper)' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--zd-safe-top) 20px 16px',
        background: 'linear-gradient(180deg, var(--card) 0%, var(--bg-deeper) 100%)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onBack} aria-label="بازگشت به پاسخ‌برگ"><ChevRightIcon size={18} /></button>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
            بازبینی · سؤال {fa(index + 1)} از {fa(total)}
          </div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <span className="zd-chip" style={{
            background: isCorrect ? 'var(--success-soft)' : 'var(--danger-soft)',
            color: isCorrect ? 'var(--success)' : 'var(--danger)',
          }}>
            {isCorrect
              ? (<><CheckIcon size={13} stroke={2.4} /> پاسخ تو درست بود</>)
              : answered
                ? (<><CloseIcon size={13} stroke={2.4} /> پاسخ تو نادرست بود</>)
                : 'به این سؤال پاسخ ندادی'}
          </span>
        </div>
      </div>

      {/* Question card (read-only) */}
      <div style={{ padding: 16 }}>
        <div className="zd-card" style={{ padding: 20 }}>
          {q.hasImage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <span className="zd-chip zd-chip-neutral"><ImageIcon size={13} stroke={2} /> سؤال تصویری</span>
            </div>
          )}
          {q.hasImage && <QuestionImagePlaceholder src={q.image} />}

          <div style={{ fontSize: 17, lineHeight: 1.65, fontWeight: 600, color: 'var(--ink)' }}>{q.text}</div>

          {/* Options — read-only, correct in green, the user's wrong pick in red */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {q.options.map((opt, i) => (
              <div key={i} className={optClass(i)} style={{ cursor: 'default' }}>
                <div className="zd-opt-letter">{OPT_LETTERS[i] ?? fa(i + 1)}</div>
                <div className="zd-opt-text">{opt}</div>
                <div className="zd-opt-mark">
                  {i === q.answer && <CheckIcon size={22} color="var(--success)" stroke={2.4} />}
                  {answered && i === userAns && i !== q.answer && <CloseIcon size={22} color="var(--danger)" stroke={2.4} />}
                </div>
              </div>
            ))}
          </div>

          {/* Explicit answer summary */}
          <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.9, color: 'var(--ink-2)' }}>
            <div>
              پاسخ تو:{' '}
              <span style={{ fontWeight: 700, color: answered ? (isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--ink-3)' }}>
                {userAns !== null ? q.options[userAns] : 'بدون پاسخ'}
              </span>
            </div>
            <div>
              پاسخ درست:{' '}
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{q.options[q.answer]}</span>
            </div>
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div style={{
              marginTop: 16, padding: 14, background: 'var(--primary-soft)', borderRadius: 14,
              border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <BulbIcon size={16} stroke={2} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary-ink)' }}>توضیح</div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>{q.explanation}</div>
            </div>
          )}
        </div>

        <button onClick={onBack} className="zd-btn zd-btn-outline zd-btn-block" style={{ marginTop: 16, height: 50 }}>
          <ChevRightIcon size={18} /> بازگشت به پاسخ‌برگ
        </button>
      </div>
    </div>
  )
}
