import React from 'react'
import type { Category } from '../types'
import { fa } from '../utils'

interface Props {
  categories: Category[]
  onPick: (cat: Category) => void
}

const W = 320
const H = 460
const POSITIONS = [
  { x: 250, y: 60 },
  { x: 100, y: 140 },
  { x: 240, y: 230 },
  { x: 110, y: 320 },
  { x: 250, y: 410 },
]

function buildPath(): string {
  return POSITIONS.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = POSITIONS[i - 1]
    const midY = (prev.y + p.y) / 2
    return `${acc} C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`
  }, '')
}

const PATH_D = buildPath()

export function JourneyPath({ categories, onPick }: Props) {
  return (
    <div className="relative w-full" style={{ height: H }}>
      {/* preserveAspectRatio="none" stretches the path horizontally with the
          container, so the calc() node positions below stay centered on it at
          any screen width (default centering left nodes ~30px off the path on
          a 400px-wide phone). Height is fixed, so only x scales. */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
           preserveAspectRatio="none"
           className="absolute inset-0">
        <defs>
          <linearGradient id="journey-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--grad-via)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)"   stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path d={PATH_D} stroke="var(--line-2)" strokeWidth="3" fill="none"
              strokeDasharray="2 7" strokeLinecap="round" opacity="0.65" />
      </svg>

      {POSITIONS.map((p, i) => {
        const cat = categories[i]
        if (!cat) return null
        const pct = Math.round((cat.done / cat.total) * 100)
        const done    = pct >= 100
        const started = pct > 0
        const isLeft  = p.x < W / 2

        return (
          <React.Fragment key={cat.id}>
            {/* Category node button */}
            <button
              onClick={() => onPick(cat)}
              aria-label={cat.title}
              style={{
                position: 'absolute',
                // Percentage locates the node CENTER on the stretched path;
                // the -35px pulls back half the fixed 70px button width.
                right: `calc(${((W - p.x) / W) * 100}% - 35px)`,
                top: p.y - 35,
                width: 70, height: 70,
                borderRadius: 24,
                background: done
                  ? 'var(--success)'
                  : started
                    ? `linear-gradient(135deg, ${cat.color}, color-mix(in oklab, ${cat.color} 60%, var(--accent)))`
                    : 'var(--card)',
                border: started ? 'none' : '2px dashed var(--line-2)',
                color: started ? '#fff' : 'var(--ink-3)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: started ? '0 8px 20px rgba(75,58,140,0.20)' : 'none',
                fontFamily: 'var(--font)',
                padding: 0,
                transition: 'transform .15s',
              }}
            >
              <div style={{ textAlign: 'center', fontSize: 11, lineHeight: 1.2, padding: '0 6px' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{cat.emoji}</div>
              </div>
            </button>

            {/* Label beside node — anchored just past the node's far edge (same
                percentage system as the node itself, +45px = half node + gap) so
                the text sits next to the emoji instead of running under it. */}
            <div style={{
              position: 'absolute',
              top: p.y - 16,
              [isLeft ? 'left' : 'right']: `calc(${((isLeft ? p.x : W - p.x) / W) * 100}% + 45px)`,
              width: 130,
              textAlign: isLeft ? 'left' : 'right',
              direction: 'rtl',
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{cat.title}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                {fa(cat.total)} سؤال
              </div>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}
