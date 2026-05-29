import React from 'react'
import type { VideoEntry } from '../videos'
import { CloseIcon, PlayIcon } from './Icons'

interface Props {
  videos: VideoEntry[]
  onSelect: (v: VideoEntry) => void
  onClose: () => void
}

export function VideoGallery({ videos, onSelect, onClose }: Props) {
  return (
    <div className="zd-overlay" style={{ direction: 'rtl' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)',
        padding: '14px 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--line)',
      }}>
        <div>
          <div className="zd-eyebrow" style={{ marginBottom: 2 }}>یادگیری تصویری</div>
          <div className="zd-h2">آموزش ویدیویی</div>
        </div>
        <button
          aria-label="بستن"
          onClick={onClose}
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'var(--bg-deeper)', border: '1px solid var(--line)',
            display: 'grid', placeItems: 'center',
            cursor: 'pointer', color: 'var(--ink-2)',
          }}
        >
          <CloseIcon size={18} stroke={2.2} />
        </button>
      </div>

      {/* 2-column grid */}
      <div style={{
        padding: '16px 20px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {videos.map(v => (
          <button
            key={v.id}
            onClick={() => onSelect(v)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'var(--card)',
              boxShadow: 'var(--shadow-sm)',
              fontFamily: 'var(--font)',
            }}
          >
            {/* Poster */}
            <div style={{
              position: 'relative',
              aspectRatio: '9/16',
              background: 'var(--bg-deeper)',
              overflow: 'hidden',
            }}>
              {/* Gradient placeholder — always rendered; covered by img when it loads */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg, var(--grad-from) 0%, var(--grad-via) 60%, var(--grad-to) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1.35 }}>
                  {v.title}
                </div>
              </div>
              {/* Poster img — covers placeholder when loaded; hides itself on 404 */}
              {v.poster && (
                <img
                  src={v.poster}
                  alt={v.title}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
              {/* Play circle overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'grid', placeItems: 'center',
                background: 'rgba(0,0,0,0.22)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 99,
                  background: 'rgba(255,255,255,0.88)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <PlayIcon size={20} color="var(--primary)" />
                </div>
              </div>
              {/* Duration badge — physical left (end side in RTL) */}
              <div style={{
                position: 'absolute', bottom: 8, left: 8,
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                fontSize: 11, fontWeight: 700,
                padding: '3px 7px', borderRadius: 6,
                fontFamily: 'var(--font)',
                direction: 'ltr',
              }}>
                {v.duration}
              </div>
            </div>

            {/* Card info */}
            <div style={{ padding: '10px 12px 12px', textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 3 }}>
                {v.title}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.4 }}>
                {v.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
