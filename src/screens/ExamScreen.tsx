import React, { useState, useEffect, useMemo } from 'react'
import type { Question, Category, ExamResult } from '../types'
import { QuestionCard } from '../components/QuestionCard'
import { CloseIcon, FlagIcon, ClockIcon, ChevRightIcon, ChevLeftIcon } from '../components/Icons'
import { fa, formatTime } from '../utils'

interface Props {
  questions: Question[]
  categories: Category[]
  onFinish: (result: ExamResult) => void
  onExit: () => void
}

const EXAM_SIZE = 30
const EXAM_DURATION = 20 * 60

export function ExamScreen({ questions, categories, onFinish, onExit }: Props) {
  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const exam = useMemo<Question[]>(() => {
    const arr: Question[] = []
    for (let i = 0; i < EXAM_SIZE; i++) arr.push(questions[i % questions.length])
    return arr
  }, [questions])

  const [idx,      setIdx]      = useState(0)
  const [answers,  setAnswers]  = useState<(number | null)[]>(Array(EXAM_SIZE).fill(null))
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION)

  // Restore selection when navigating back
  useEffect(() => { setSelected(answers[idx]) }, [idx])

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); finish(answers); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const q   = exam[idx]
  const cat = catMap[q.cat]

  function commitAndMove(delta: number) {
    const updated = [...answers]
    updated[idx] = selected
    setAnswers(updated)
    setIdx(i => i + delta)
  }

  function finish(currentAnswers: (number | null)[]) {
    const updated = [...currentAnswers]
    updated[idx] = selected
    const correct = updated.filter((a, i) => a === exam[i].answer).length
    onFinish({ answers: updated, exam, correct, total: EXAM_SIZE, timeUsed: EXAM_DURATION - timeLeft })
  }

  function handleNext() {
    if (idx === exam.length - 1) {
      finish(answers)
    } else {
      commitAndMove(1)
    }
  }

  const lowTime = timeLeft < 60

  return (
    <div className="zd-scroll" style={{ background: 'var(--bg-deeper)' }}>
      {/* Exam header */}
      <div style={{
        padding: '54px 20px 16px',
        background: 'linear-gradient(180deg, var(--card) 0%, var(--bg-deeper) 100%)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onExit}>
            <CloseIcon size={18} />
          </button>

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 12, fontWeight: 700,
            background: lowTime ? 'var(--danger-soft)' : 'var(--primary-soft)',
            color: lowTime ? 'var(--danger)' : 'var(--primary-ink)',
          }}>
            <ClockIcon size={16} stroke={2.2} />
            <span className="zd-num" style={{ fontSize: 15, letterSpacing: 0.5 }}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button className="zd-icon-btn" onClick={() => finish(answers)}>
            <FlagIcon size={18} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 16 }}>
          <div className="flex justify-between items-baseline" style={{ marginBottom: 8 }}>
            <div>
              <div className="zd-eyebrow">شبیه‌ساز آزمون</div>
              <div className="zd-num" style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: 'var(--ink)' }}>
                سؤال {fa(idx + 1)} <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>/ {fa(EXAM_SIZE)}</span>
              </div>
            </div>
            <span className="zd-chip" style={{
              background: `color-mix(in oklab, ${cat?.color ?? 'var(--primary)'} 14%, transparent)`,
              color: cat?.color ?? 'var(--primary)',
            }}>
              {cat?.emoji} {cat?.title}
            </span>
          </div>

          {/* Question dots */}
          <div className="flex" style={{ gap: 3 }}>
            {Array.from({ length: EXAM_SIZE }).map((_, i) => {
              const answered = answers[i] !== null && i !== idx
              const current  = i === idx
              return (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 999,
                  background: current ? 'var(--primary)' : answered ? 'var(--primary-soft)' : 'var(--line)',
                  border: answered && !current ? `1px solid color-mix(in oklab, var(--primary) 35%, transparent)` : 'none',
                  transition: 'background .2s',
                }} />
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <QuestionCard
          question={{ ...q, catLabel: cat?.title }}
          selected={selected}
          onSelect={setSelected}
          submitted={false}
          bookmarked={false}
          showExplanation={false}
        />

        <div className="flex" style={{ gap: 10, marginTop: 16 }}>
          <button onClick={() => commitAndMove(-1)} disabled={idx === 0}
                  className="zd-btn zd-btn-outline"
                  style={{ flex: 1, height: 50, opacity: idx === 0 ? 0.5 : 1 }}>
            <ChevRightIcon size={18} />
            قبلی
          </button>
          <button onClick={handleNext}
                  className="zd-btn zd-btn-primary"
                  style={{ flex: 2, height: 50 }}>
            {idx === EXAM_SIZE - 1 ? 'پایان آزمون' : 'بعدی'}
            <ChevLeftIcon size={18} stroke={2.4} />
          </button>
        </div>
      </div>
    </div>
  )
}
