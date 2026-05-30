import React, { useState, useMemo } from 'react'
import type { Question, Category, Progress, SignKind } from '../types'
import { QuestionCard } from '../components/QuestionCard'
import { ChevRightIcon, MoreIcon, FireIcon, CheckIcon } from '../components/Icons'
import { fa } from '../utils'

interface Props {
  questions: Question[]
  categories: Category[]
  progress: Progress
  onToggleBookmark: (id: string) => void
  onRecordWrong: (ids: string[]) => void
  onExitToHome: () => void
}

export function PracticeScreen({ questions, categories, progress, onToggleBookmark, onRecordWrong, onExitToHome }: Props) {
  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const [idx,       setIdx]       = useState(0)
  const [selected,  setSelected]  = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [streak,    setStreak]    = useState(0)

  const q   = questions[idx]
  const cat = catMap[q.cat]

  const signKind: SignKind | null = useMemo(() => {
    if (q.cat !== 'signs') return null
    const kinds: SignKind[] = ['stop', 'mandatory', 'warn', 'speed']
    return kinds[idx % 4]
  }, [q.id, idx, q.cat])

  function handleSubmit() {
    if (selected === null) return
    setSubmitted(true)
    setStreak(s => selected === q.answer ? s + 1 : 0)
    if (selected !== q.answer) onRecordWrong([q.id])
  }

  function handleNext() {
    setSelected(null)
    setSubmitted(false)
    setIdx(i => (i + 1) % questions.length)
  }

  const sessionPct = ((idx + 1) / questions.length) * 100

  return (
    <div className="zd-scroll">
      {/* Header */}
      <div className="zd-header">
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onExitToHome}>
            <ChevRightIcon size={18} />
          </button>
          <div className="flex items-center" style={{ gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
            <FireIcon size={16} color="var(--accent)" stroke={2.2} />
            <span className="zd-num">{fa(streak)} درست پشت سر هم</span>
          </div>
          <button className="zd-icon-btn"><MoreIcon size={18} /></button>
        </div>

        <div style={{ marginTop: 8 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>تمرین موضوعی</div>
            <div className="zd-num" style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>
              {fa(idx + 1)} از {fa(questions.length)}
            </div>
          </div>
          <div className="zd-bar"><div className="zd-bar-fill" style={{ width: `${sessionPct}%` }} /></div>
        </div>
      </div>

      <div style={{ padding: '8px 16px' }}>
        <QuestionCard
          question={{ ...q, catLabel: cat?.title }}
          selected={selected}
          onSelect={setSelected}
          submitted={submitted}
          bookmarked={progress.bookmarked.includes(q.id)}
          onBookmark={() => onToggleBookmark(q.id)}
          signKind={signKind}
          signN={q.text.includes('۵۰') ? '۵۰' : '۸۰'}
          showExplanation
        />

        {!submitted ? (
          <button onClick={handleSubmit} disabled={selected === null}
                  className="zd-btn zd-btn-primary zd-btn-block"
                  style={{ marginTop: 16, height: 54, fontSize: 16, opacity: selected === null ? 0.5 : 1 }}>
            بررسی پاسخ
            <CheckIcon size={18} stroke={2.4} />
          </button>
        ) : (
          <button onClick={handleNext}
                  className="zd-btn zd-btn-primary zd-btn-block"
                  style={{ marginTop: 16, height: 54, fontSize: 16 }}>
            سؤال بعدی
            <ChevRightIcon size={18} stroke={2.4} />
          </button>
        )}
      </div>
    </div>
  )
}
