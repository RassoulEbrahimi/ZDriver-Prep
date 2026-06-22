import React from 'react'
import type { ThemeMode } from '../theme'
import { CheckIcon, RefreshIcon } from './Icons'

interface Props {
  mode: ThemeMode
  onSelect: (mode: ThemeMode) => void
  onClose: () => void
}

const OPTIONS: { mode: ThemeMode; label: string; desc: string; emoji: string }[] = [
  { mode: 'system', label: 'سیستم', desc: 'هماهنگ با دستگاه', emoji: '🖥️' },
  { mode: 'light',  label: 'روشن',  desc: 'همیشه روشن',       emoji: '☀️' },
  { mode: 'dark',   label: 'تیره',  desc: 'همیشه تیره',       emoji: '🌙' },
]

/** Bottom-sheet theme selector (سیستم / روشن / تیره). Selecting a mode applies
 *  and persists it immediately; the sheet stays open so the change is visible. */
export function ThemeSheet({ mode, onSelect, onClose }: Props) {
  return (
    <div className="zd-backdrop" onClick={onClose}>
      <div className="zd-sheet" onClick={e => e.stopPropagation()}>
        <div className="zd-sheet-grip" />

        <div style={{ position: 'relative', marginBottom: 4 }}>
          {/* Icon-only manual reload (Android + iOS). Reloads the app normally. */}
          <button
            onClick={() => window.location.reload()}
            aria-label="نوسازی برنامه"
            title="نوسازی برنامه"
            style={{
              position: 'absolute', top: 0, insetInlineStart: 0,
              width: 40, height: 40, borderRadius: 12,
              border: '1px solid var(--line)', background: 'var(--card-2)',
              color: 'var(--ink-2)', display: 'grid', placeItems: 'center',
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}
          >
            <RefreshIcon size={18} stroke={2} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <div className="zd-eyebrow" style={{ color: 'var(--primary-ink)', fontWeight: 700 }}>نمایش</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>حالت نمایش</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.6 }}>
              روشن، تیره یا هماهنگ با دستگاه
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {OPTIONS.map(o => {
            const active = mode === o.mode
            return (
              <button
                key={o.mode}
                onClick={() => onSelect(o.mode)}
                className="zd-card"
                style={{
                  width: '100%', textAlign: 'right', cursor: 'pointer', fontFamily: 'var(--font)',
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  border: active ? '1.5px solid var(--primary)' : '1px solid var(--line)',
                  background: active ? 'var(--primary-soft)' : 'var(--card)',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  display: 'grid', placeItems: 'center', fontSize: 20,
                  background: 'var(--card-2)', border: '1px solid var(--line)',
                }}>{o.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{o.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{o.desc}</div>
                </div>
                {active && <CheckIcon size={20} color="var(--primary)" stroke={2.4} />}
              </button>
            )
          })}
        </div>

        <button onClick={onClose} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 46, marginTop: 16, fontSize: 14 }}>
          بستن
        </button>
      </div>
    </div>
  )
}
