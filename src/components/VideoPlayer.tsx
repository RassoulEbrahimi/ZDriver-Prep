import React, { useRef, useEffect } from 'react'
import type { VideoEntry } from '../videos'
import { CloseIcon } from './Icons'

interface Props {
  video: VideoEntry
  onClose: () => void
}

export function VideoPlayer({ video, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Attempt autoplay when the video src is set (fires on mount and src change).
  // The tap on a gallery card is a user gesture so play() should succeed;
  // .catch() silently absorbs any browser-blocked rejection.
  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [video.src])

  // Pause and release on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
      }
    }
  }, [])

  return (
    <div className="zd-video-fullscreen">
      {/* Close button — top-right (start side for RTL) */}
      <button
        aria-label="بستن"
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 201,
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'grid', placeItems: 'center',
          cursor: 'pointer', color: '#fff',
        }}
      >
        <CloseIcon size={20} stroke={2.2} />
      </button>

      {/* Native video — always LTR so controls render correctly */}
      <video
        ref={videoRef}
        src={video.src}
        poster={video.poster || undefined}
        controls
        playsInline
        dir="ltr"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {/* Title gradient footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '40px 20px 80px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.72) 0%, transparent 100%)',
        color: '#fff', direction: 'rtl',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{video.title}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 4, lineHeight: 1.4 }}>
          {video.subtitle}
        </div>
      </div>
    </div>
  )
}
