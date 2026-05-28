import React, { useState, useMemo } from 'react'
import type { Question, Category, Progress } from '../types'
import { CloseIcon, BookmarkFilledIcon, RefreshIcon, CheckIcon } from '../components/Icons'
import { fa } from '../utils'

interface Props {
  progress: Progress
  questions: Question[]
  categories: Category[]
  onRetry: () => void
}

type Tab = 'wrong' | 'bookmark'

export function MistakesScreen({ progress, questions, categories, onRetry }: Props) {
  const [tab, setTab] = useState<Tab>('wrong')

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const ids   = tab === 'wrong' ? progress.wrongQuestionIds : progress.bookmarked
  const items = ids.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[]

  const tabs: { id: Tab; label: string; icon: typeof CloseIcon }[] = [
    { id: 'wrong',    label: `اشتباهات (${fa(progress.wrongQuestionIds.length)})`, icon: CloseIcon },
    { id: 'bookmark', label: `نشان‌شده (${fa(progress.bookmarked.length)})`,       icon: BookmarkFilledIcon },
  ]

  return (
    <div className="zd-scroll">
      {/* Header */}
      <div className="zd-header">
        <div className="zd-header-row">
          <div />
          <div />
        </div>
        <div style={{ marginTop: 6 }}>
          <div className="zd-eyebrow" style={{ marginBottom: 4 }}>جایی برای رفع نقاط ضعف</div>
          <div className="zd-h1">اشتباهات و مرور</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Segmented control */}
        <div style={{
          background: 'var(--bg-deeper)', padding: 4, borderRadius: 14,
          display: 'flex', gap: 4, marginBottom: 16,
        }}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, height: 38, border: 'none', cursor: 'pointer',
                background: active ? 'var(--card)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                borderRadius: 11, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icon size={15} stroke={2.1} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Retry CTA */}
        {items.length > 0 && (
          <button onClick={onRetry} className="zd-btn zd-btn-primary zd-btn-block" style={{ marginBottom: 16 }}>
            <RefreshIcon size={18} stroke={2.2} />
            مرور {fa(items.length)} سؤال
          </button>
        )}

        {/* Question cards */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          {items.map(q => {
            const cat        = catMap[q.cat]
            const correctText = q.options[q.answer]
            return (
              <div key={q.id} className="zd-card" style={{ padding: 14 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
                  <span className="zd-chip" style={{
                    background: `color-mix(in oklab, ${cat?.color ?? 'var(--primary)'} 14%, transparent)`,
                    color: cat?.color ?? 'var(--primary)',
                  }}>
                    {cat?.emoji} {cat?.title}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fa(2)} روز پیش</div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.6, marginBottom: 10 }}>
                  {q.text}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, padding: '8px 10px',
                  background: 'var(--success-soft)', borderRadius: 10,
                }}>
                  <CheckIcon size={16} stroke={2.4} color="var(--success)" />
                  <span style={{ color: 'var(--ink-2)' }}>پاسخ درست: </span>
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{correctText}</span>
                </div>

                <div className="flex" style={{ gap: 8, marginTop: 10 }}>
                  <button className="zd-btn zd-btn-ghost"   style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}>دوباره امتحان کن</button>
                  <button className="zd-btn zd-btn-outline" style={{ padding: '10px 14px', fontSize: 13 }}>توضیح</button>
                </div>
              </div>
            )
          })}

          {items.length === 0 && (
            <div className="zd-card text-center" style={{ padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>هنوز اشتباهی ثبت نشده</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                به تمرین ادامه بده تا نکات ضعف مشخص شوند.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
