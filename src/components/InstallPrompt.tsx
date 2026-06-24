import React, { useEffect, useState } from 'react'
import { CloseIcon } from './Icons'

/** Minimal type for the non-standard beforeinstallprompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'zd-install-dismissed'
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000 // ~14 days

function isStandalone(): boolean {
  try {
    return (
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}

function dismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const t = Date.parse(raw)
    return Number.isFinite(t) && Date.now() - t < COOLDOWN_MS
  } catch {
    return false
  }
}

/** iOS (incl. iPadOS-as-Mac), where beforeinstallprompt is never fired. */
function detectIOS(): boolean {
  try {
    const ua = navigator.userAgent || ''
    return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  } catch {
    return false
  }
}

interface Props {
  /** When true (e.g. the update toast is showing), suppress the install button. */
  hidden?: boolean
}

/**
 * Floating install affordance (Phase 5E) for un-installed browser users.
 * - Chromium: captures beforeinstallprompt and triggers the native install dialog.
 * - iOS/Safari: shows a Persian "Share → Add to Home Screen" instruction sheet.
 * Renders nothing in standalone/installed mode, after dismissal (cooldown), or when hidden.
 */
export function InstallPrompt({ hidden = false }: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [showIosSheet, setShowIosSheet] = useState(false)
  const [dismissed, setDismissed] = useState<boolean>(() => dismissedRecently())

  const ios = detectIOS()
  const standalone = isStandalone()

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }
    const onInstalled = () => {
      setInstalled(true)
      setCanInstall(false)
      setDeferred(null)
      setShowIosSheet(false)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function persistDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString())
    } catch {
      /* storage unavailable — ignore */
    }
    setDismissed(true)
    setShowIosSheet(false)
  }

  async function handleInstall() {
    if (deferred) {
      try {
        await deferred.prompt()
        await deferred.userChoice
      } catch {
        /* user closed / not available */
      }
      setDeferred(null)
      setCanInstall(false)
    } else if (ios) {
      setShowIosSheet(true)
    }
  }

  // Never show in standalone/installed, within dismissal cooldown, or while suppressed.
  if (standalone || installed || dismissed || hidden) return null
  // Only show when install is actually available (Chromium) or on iOS (manual steps).
  if (!canInstall && !ios) return null

  return (
    <>
      <div
        style={{
          position: 'absolute',
          // Sit above the floating tab bar (bottom:20 + height:64) PLUS the bottom
          // safe area, so the pill never overlaps the nav on devices with a home
          // indicator. Mirrors the .zd-scroll bottom padding reservation.
          bottom: 'calc(96px + env(safe-area-inset-bottom))', left: 16, zIndex: 55,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: 6, paddingInlineStart: 14,
          borderRadius: 999,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font)',
          animation: 'zd-fade-up .25s ease both',
        }}
      >
        <button
          onClick={handleInstall}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)',
            padding: '6px 2px',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>📲</span>
          نصب برنامه
        </button>
        <button
          onClick={persistDismiss}
          aria-label="بعداً"
          style={{
            width: 30, height: 30, borderRadius: 999, flexShrink: 0,
            border: 'none', cursor: 'pointer',
            background: 'var(--bg-deeper)', color: 'var(--ink-3)',
            display: 'grid', placeItems: 'center',
          }}
        >
          <CloseIcon size={15} stroke={2.2} />
        </button>
      </div>

      {showIosSheet && (
        <div className="zd-backdrop" onClick={() => setShowIosSheet(false)}>
          <div className="zd-sheet" onClick={e => e.stopPropagation()}>
            <div className="zd-sheet-grip" />
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, margin: '0 auto 12px',
                background: 'var(--primary-soft)', color: 'var(--primary)',
                display: 'grid', placeItems: 'center', fontSize: 28,
              }}>📲</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>نصب روی آیفون</div>
            </div>
            <div style={{
              fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.8, textAlign: 'center',
              padding: '4px 6px 0',
            }}>
              روی دکمهٔ هم‌رسانی (Share) در نوار مرورگر بزن، سپس «Add to Home Screen / افزودن به صفحهٔ خانه» را انتخاب کن.
            </div>
            <button
              onClick={() => setShowIosSheet(false)}
              className="zd-btn zd-btn-ghost zd-btn-block"
              style={{ height: 46, marginTop: 20, fontSize: 14 }}
            >
              بعداً
            </button>
          </div>
        </div>
      )}
    </>
  )
}
