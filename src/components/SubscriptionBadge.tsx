// Phase S2 — Subscription status pill (calm, derived from the fail-closed
// entitlement read). S3A adds a non-blocking "خرید اشتراک" entry that opens the
// manual bank-transfer purchase sheet for non-subscribed users. It never locks
// content and never writes anything.

import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useEntitlement } from '../auth/useEntitlement'
import { ManualSubscriptionSheet } from './ManualSubscriptionSheet'

/** Format an ISO expiry to a Jalali date with Persian digits; '' on any problem. */
function formatExpiry(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

export function SubscriptionBadge() {
  const { status: authStatus } = useAuth()
  const { status, entitlement } = useEntitlement()
  const [purchaseOpen, setPurchaseOpen] = useState(false)

  // Resolve { label, dot } for the current state. `dot` is a theme token used
  // for a small status dot; tone stays calm (no pressure, no purchase copy).
  let label: string
  let dot = 'var(--ink-4)'

  if (status === 'loading') {
    label = 'بررسی اشتراک...'
  } else if (status === 'unavailable') {
    label = 'وضعیت اشتراک در دسترس نیست'
  } else if (entitlement.active && entitlement.status === 'active') {
    const until = formatExpiry(entitlement.expiresAt)
    label = until ? `اشتراک کامل فعال است — تا ${until}` : 'اشتراک کامل فعال است'
    dot = 'var(--primary)'
  } else if (entitlement.status === 'expired') {
    label = 'اشتراک پایان یافته'
    dot = 'var(--danger)'
  } else if (authStatus === 'authed') {
    // Signed in, no (active) subscription.
    label = 'اشتراک فعال نیست'
    dot = 'var(--accent-deep)'
  } else {
    // Guest / signed out.
    label = 'نسخه رایگان'
  }

  // A purchase entry makes sense once the status is known and the user is not an
  // active subscriber (guest/free, signed-in-without-subscription, or expired).
  const actionable = status === 'ready' && !(entitlement.active && entitlement.status === 'active')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div
        className="zd-card"
        role="status"
        aria-label={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 13px',
          borderRadius: 999,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          maxWidth: '100%',
        }}
      >
        <span
          aria-hidden="true"
          style={{ width: 8, height: 8, borderRadius: 999, background: dot, flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--ink-2)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>

      {actionable && (
        <button
          onClick={() => setPurchaseOpen(true)}
          style={{
            height: 32,
            padding: '0 14px',
            borderRadius: 999,
            cursor: 'pointer',
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            fontFamily: 'var(--font)',
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          خرید اشتراک
        </button>
      )}

      {purchaseOpen && <ManualSubscriptionSheet onClose={() => setPurchaseOpen(false)} />}
    </div>
  )
}
