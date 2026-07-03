// M6A-2 — Dev-only social capture viewer for batch 01.
//
// Renders the REAL <QuestionCard> (the same component users see in the app) for
// each of the 30 approved batch-01 questions, in both the "unanswered" and
// "revealed" states, inside a stable phone-like frame for manual visual review.
//
// Data flow (all read-only, no app state touched):
//   manifest.json  -> ordered list of the 30 question ids to review
//   SOURCE_EXAMS_DATA + toSourceExamQuestion -> real question content + resolved
//                                               (Vite-bundled) image URLs
//
// State is expressed purely through QuestionCard props:
//   unanswered -> submitted=false, selected=null
//   revealed   -> submitted=true,  selected=question.answer, showExplanation=true
//
// No Playwright, no screenshot generation, no production imports.

import React, { useMemo, useState, useCallback } from 'react'
import { QuestionCard } from '../../src/components/QuestionCard'
import { SOURCE_EXAMS_DATA } from '../../src/data/source-exams'
import { toSourceExamQuestion } from '../../src/data/source-exams/adapter'
import type { SourceExamQuestion } from '../../src/types'
import manifestData from '../social-batch-01/manifest.json'

type CaptureState = 'unanswered' | 'revealed'

interface ManifestVideo {
  video_id: string
  question_id: string
  source_exam: number
  category: string
  hook: string
  caption: string
}

const manifest = manifestData as { batch: string; videos: ManifestVideo[] }
const VIDEOS = manifest.videos

// Persian category labels (mirrors CATEGORY_META in src/data.ts). Kept as a small
// local map so the viewer stays decoupled from the app's heavy data module.
const CAT_LABEL: Record<string, string> = {
  signs: 'تابلوها و علائم',
  rules: 'قوانین راهنمایی',
  safety: 'ایمنی و رفتار',
  vehicle: 'فنی و خودرو',
  firstaid: 'کمک‌های اولیه',
}

// Flatten every authored question once and adapt it to the runtime shape (this is
// what resolves the bundled image URL for image-dependent sign questions).
const QUESTION_BY_ID: Map<string, SourceExamQuestion> = (() => {
  const map = new Map<string, SourceExamQuestion>()
  for (const exam of SOURCE_EXAMS_DATA) {
    for (const q of exam.questions) map.set(q.id, toSourceExamQuestion(q))
  }
  return map
})()

function readParams(): { id: string | null; state: CaptureState } {
  const p = new URLSearchParams(window.location.search)
  const id = p.get('id')
  const state: CaptureState = p.get('state') === 'revealed' ? 'revealed' : 'unanswered'
  return { id, state }
}

export function CaptureViewer() {
  const initial = readParams()
  // Default to the first manifest item when no id is given.
  const [id, setId] = useState<string | null>(initial.id ?? (VIDEOS[0]?.question_id ?? null))
  const [state, setState] = useState<CaptureState>(initial.state)

  // Keep the URL in sync so the current frame is always copy-pasteable.
  const syncUrl = useCallback((nextId: string | null, nextState: CaptureState) => {
    const p = new URLSearchParams()
    if (nextId) p.set('id', nextId)
    p.set('state', nextState)
    window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`)
  }, [])

  const index = useMemo(() => VIDEOS.findIndex(v => v.question_id === id), [id])
  const meta = index >= 0 ? VIDEOS[index] : undefined
  const question = id ? QUESTION_BY_ID.get(id) : undefined

  const go = useCallback((nextIndex: number) => {
    const clamped = Math.max(0, Math.min(VIDEOS.length - 1, nextIndex))
    const nextId = VIDEOS[clamped]?.question_id ?? null
    setId(nextId)
    syncUrl(nextId, state)
  }, [state, syncUrl])

  const toggleState = useCallback(() => {
    setState(prev => {
      const next: CaptureState = prev === 'unanswered' ? 'revealed' : 'unanswered'
      syncUrl(id, next)
      return next
    })
  }, [id, syncUrl])

  // Props that drive QuestionCard's two states.
  const submitted = state === 'revealed'
  const selected = state === 'revealed' && question ? question.answer : null

  return (
    <div style={outerStyle}>
      {/* ---- Toolbar (outside the frame) ---- */}
      <div style={toolbarStyle}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          Capture Viewer · batch 01 <span style={{ opacity: 0.6, fontWeight: 500 }}>(dev only)</span>
        </div>
        <div style={rowStyle}>
          <button style={btnStyle} onClick={() => go(index - 1)} disabled={index <= 0}>‹ قبلی</button>
          <span style={{ minWidth: 96, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {index >= 0 ? `${index + 1} / ${VIDEOS.length}` : '— / —'}
          </span>
          <button style={btnStyle} onClick={() => go(index + 1)} disabled={index < 0 || index >= VIDEOS.length - 1}>بعدی ›</button>
          <span style={{ width: 16 }} />
          <button style={{ ...btnStyle, ...toggleBtnStyle(state) }} onClick={toggleState}>
            {state === 'unanswered' ? 'حالت: بدون پاسخ' : 'حالت: پاسخ داده‌شده'}
          </button>
        </div>
        {meta && (
          <div style={{ fontSize: 12, opacity: 0.75, direction: 'ltr', textAlign: 'left' }}>
            {meta.video_id} · {meta.question_id} · exam {meta.source_exam} · {CAT_LABEL[meta.category] ?? meta.category}
          </div>
        )}
      </div>

      {/* ---- Phone-like frame (the review surface) ---- */}
      <div style={frameShellStyle}>
        <div style={frameStyle} className="zd-scope">
          {question ? (
            <QuestionCard
              question={{ ...question, catLabel: CAT_LABEL[question.cat] ?? question.cat }}
              selected={selected}
              onSelect={() => { /* review-only: selection is driven by state, not clicks */ }}
              submitted={submitted}
              showExplanation
            />
          ) : (
            <div style={errorStyle}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>شناسهٔ نامعتبر</div>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                سؤالی با شناسهٔ <code style={codeStyle}>{id ?? '—'}</code> پیدا نشد.
              </div>
              <div style={{ fontSize: 13, marginTop: 12, opacity: 0.8 }}>
                یکی از {VIDEOS.length} شناسهٔ معتبر بچ ۰۱ را در پارامتر <code style={codeStyle}>?id=</code> بگذارید،
                برای نمونه:{' '}
                <a style={linkStyle} href={`?id=${VIDEOS[0]?.question_id}&state=unanswered`}>
                  {VIDEOS[0]?.question_id}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Inline styles (self-contained; app CSS vars still apply via index.css) ----
const outerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-deeper, #14122a)',
  color: 'var(--ink, #eee)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px 16px 48px',
  gap: 20,
  fontFamily: 'inherit',
}
const toolbarStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 14,
  borderRadius: 14,
  background: 'var(--bg, #1f1a36)',
  border: '1px solid color-mix(in oklab, var(--ink, #fff) 12%, transparent)',
}
const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }
const btnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
  border: '1px solid color-mix(in oklab, var(--ink, #fff) 18%, transparent)',
  background: 'transparent', color: 'inherit', fontSize: 14, fontFamily: 'inherit',
}
const toggleBtnStyle = (s: CaptureState): React.CSSProperties => ({
  background: s === 'revealed'
    ? 'color-mix(in oklab, var(--success, #3aa) 22%, transparent)'
    : 'color-mix(in oklab, var(--primary, #4B3A8C) 22%, transparent)',
  fontWeight: 700,
})
// Fixed phone-like review frame (~390px column, tall enough for reveal state).
const frameShellStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', width: '100%' }
const frameStyle: React.CSSProperties = {
  width: 390,
  minHeight: 720,
  boxSizing: 'border-box',
  padding: 16,
  borderRadius: 28,
  background: 'var(--bg, #1f1a36)',
  border: '8px solid #000',
  boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
  overflow: 'hidden',
}
const errorStyle: React.CSSProperties = {
  padding: 24, borderRadius: 16,
  background: 'color-mix(in oklab, var(--danger, #c66) 12%, transparent)',
  border: '1px solid color-mix(in oklab, var(--danger, #c66) 40%, transparent)',
}
const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace', direction: 'ltr', display: 'inline-block',
  padding: '1px 6px', borderRadius: 6,
  background: 'color-mix(in oklab, var(--ink, #fff) 12%, transparent)',
}
const linkStyle: React.CSSProperties = { color: 'var(--primary-ink, #b9a9ff)', fontFamily: 'monospace', direction: 'ltr' }
