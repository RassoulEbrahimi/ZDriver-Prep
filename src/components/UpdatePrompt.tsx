import React, { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshIcon, CloseIcon } from './Icons'

/**
 * User-facing PWA update prompt (Phase 5D).
 *
 * With registerType:'prompt', a newly deployed service worker waits instead of
 * auto-activating. This component surfaces `needRefresh` as a small Persian-RTL
 * bottom toast; «به‌روزرسانی» activates the waiting SW and reloads, «بعداً» hides it.
 * It also asks the SW to check for updates when the app regains focus / becomes
 * visible, so long-lived sessions discover new builds without a manual navigation.
 */
export function UpdatePrompt() {
  const regRef = useRef<ServiceWorkerRegistration | undefined>(undefined)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      regRef.current = registration
    },
  })

  // Re-check for a waiting/new SW when the tab regains focus or becomes visible.
  useEffect(() => {
    const check = () => {
      const reg = regRef.current
      if (reg && document.visibilityState === 'visible') {
        reg.update().catch(() => {})
      }
    }
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  if (!needRefresh) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        bottom: 96, left: 16, right: 16, // sits above the tab bar (bottom:20 + height:64)
        zIndex: 60,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        borderRadius: 16,
        background: 'var(--card)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-lg)',
        fontFamily: 'var(--font)',
        animation: 'zd-fade-up .25s ease both',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
        background: 'var(--primary-soft)', color: 'var(--primary)',
        display: 'grid', placeItems: 'center',
      }}>
        <RefreshIcon size={18} stroke={2.1} />
      </div>

      <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>
        نسخهٔ جدیدی از برنامه در دسترس است.
      </div>

      <button
        onClick={() => updateServiceWorker(true)}
        className="zd-btn zd-btn-primary"
        style={{ height: 38, padding: '0 14px', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        به‌روزرسانی
      </button>

      <button
        onClick={() => setNeedRefresh(false)}
        aria-label="بعداً"
        className="zd-btn zd-btn-ghost"
        style={{ height: 38, padding: '0 12px', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        بعداً
      </button>
    </div>
  )
}
