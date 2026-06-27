import React, { useEffect } from 'react'
import { UserIcon } from './Icons'

interface Props {
  /** Open the auth (login / sign-up) sheet. */
  onSignup: () => void
  onClose: () => void
}

/**
 * Guest gate sheet (UI polish): shown when a signed-out user taps a locked exam.
 * Deliberately carries NO payment details (price / card / IBAN / holder) — guests
 * are encouraged to create an account first; the purchase sheet is reserved for
 * authenticated, non-subscribed users. Persian RTL bottom sheet reusing the
 * shared zd-sheet styling (Light/Dark/RTL automatic).
 */
export function SignupPromptSheet({ onSignup, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="zd-backdrop" onClick={onClose}>
      <div className="zd-sheet" role="dialog" aria-modal="true" aria-label="ساخت حساب" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="zd-sheet-grip" />

        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, margin: '4px auto 12px',
            background: 'var(--primary-soft)', color: 'var(--primary)',
            display: 'grid', placeItems: 'center',
          }}>
            <UserIcon size={26} stroke={2} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)' }}>
            برای دسترسی کامل، حساب بسازید
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.8 }}>
            برای خرید اشتراک و باز شدن همه آزمون‌ها، ابتدا وارد حساب شوید یا ثبت‌نام کنید.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          <button onClick={onSignup} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 50, fontSize: 15 }}>
            ورود / ثبت‌نام
          </button>
          <button onClick={onClose} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 44, fontSize: 13.5 }}>
            بستن
          </button>
        </div>
      </div>
    </div>
  )
}
