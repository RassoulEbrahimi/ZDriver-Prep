import React from 'react'
import { ImageIcon } from './Icons'

interface Props {
  /** Real image URL/asset. When provided, it renders instead of the placeholder.
   *  Phase 4C/4D will pass real source-exam images here. */
  src?: string
  alt?: string
}

/**
 * Image area for image-dependent questions. Until real images exist (Phase 4C/4D),
 * this shows a clean striped placeholder; pass `src` later to render the real image
 * with no other changes to the question screen.
 */
export function QuestionImagePlaceholder({ src, alt = 'تصویر مربوط به سؤال' }: Props) {
  if (src) {
    // Exam images are part of the question — never crop. Render the full image,
    // fit to the card width with automatic height; the page may scroll if tall.
    return (
      <img
        src={src}
        alt={alt}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 16,
          marginBottom: 16,
          border: '1px solid var(--line)',
          background: 'var(--card-2)',
          padding: 6,
        }}
      />
    )
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%', aspectRatio: '16 / 9',
      borderRadius: 16, overflow: 'hidden', marginBottom: 16,
      background: 'repeating-linear-gradient(135deg, var(--bg-deeper) 0 14px, var(--card-2) 14px 28px)',
      border: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'var(--card)', border: '1px solid var(--line)',
        display: 'grid', placeItems: 'center', color: 'var(--ink-4)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <ImageIcon size={24} stroke={1.8} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{alt}</div>
    </div>
  )
}
