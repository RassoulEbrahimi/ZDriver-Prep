import React, { useState, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { manualPayment, formatPriceNumber } from '../config/manualPayment'
import { useDialog } from '../hooks/useDialog'
import { CloseIcon } from './Icons'

interface Props {
  onClose: () => void
}

interface Plan {
  id: string
  months: number
  price: number
  label: string
}

// Fixed plan menu (M4D). Prices are literal Toman amounts, not env-driven —
// unlike the single legacy price, these are fixed subscription tiers.
const PLANS: Plan[] = [
  { id: '1m', months: 1, price: 399000,  label: 'یک ماهه' },
  { id: '3m', months: 3, price: 999000,  label: 'سه ماهه' },
  { id: '6m', months: 6, price: 1699000, label: 'شش ماهه' },
]
const DEFAULT_PLAN_ID = '3m'

/**
 * S3A — Manual bank-transfer subscription purchase sheet. Display + copy only:
 * no payment gateway, no automatic activation, no backend calls. Persian RTL
 * bottom sheet reusing the existing zd-sheet styling (Light/Dark/RTL automatic).
 * Telegram is the only support channel (WhatsApp rejected for launch).
 */
export function ManualSubscriptionSheet({ onClose }: Props) {
  const { status, user } = useAuth()
  const authed = status === 'authed' && !!user
  const email = authed ? (user?.email ?? null) : null

  const [planId, setPlanId] = useState<string>(DEFAULT_PLAN_ID)
  const selectedPlan = PLANS.find(p => p.id === planId) ?? PLANS[1]!
  const selectedPriceNumber = formatPriceNumber(String(selectedPlan.price))

  // Prepared support message the user sends to support alongside the receipt.
  const supportMessage = [
    'سلام، من پرداخت اشتراک رانندگی‌یار را انجام دادم.',
    '',
    'ایمیل حساب کاربری:',
    email ?? '—',
    '',
    'مبلغ پرداختی:',
    `${selectedPriceNumber} تومان`,
    '',
    'نوع اشتراک:',
    `اشتراک ${selectedPlan.label} رانندگی‌یار`,
    '',
    'رسید پرداخت را در همین پیام ارسال می‌کنم.',
  ].join('\n')

  // Per-key "copied" feedback. Best-effort clipboard; never throws.
  const [copied, setCopied] = useState<string | null>(null)
  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(c => (c === key ? null : c)), 1500)
    } catch {
      /* clipboard unavailable — ignore; the value is still visible to copy manually */
    }
  }

  function openUrl(url: string) {
    try { window.open(url, '_blank', 'noopener,noreferrer') } catch { /* ignore */ }
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--card-2)', border: '1px solid var(--line)',
    borderRadius: 12, padding: '10px 12px',
  }
  const labelStyle: React.CSSProperties = { fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 3 }
  const valueStyle: React.CSSProperties = { fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', direction: 'ltr', textAlign: 'left' }
  const copyBtn: React.CSSProperties = {
    flexShrink: 0, height: 44, padding: '0 14px', borderRadius: 12, cursor: 'pointer',
    border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--primary)',
    fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700,
  }

  const sheetRef = useRef<HTMLDivElement>(null)
  useDialog(sheetRef, onClose)

  return (
    <div className="zd-backdrop" onClick={onClose}>
      <div ref={sheetRef} className="zd-sheet" role="dialog" aria-modal="true" aria-label="خرید اشتراک" onClick={e => e.stopPropagation()}>
        <div className="zd-sheet-grip" />

        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 6 }}>
          <button
            onClick={onClose}
            aria-label="بستن پنجره خرید اشتراک"
            style={{
              position: 'absolute', top: 0, insetInlineStart: 0,
              width: 32, height: 32, borderRadius: 10,
              border: '1px solid var(--line)', background: 'var(--card-2)',
              color: 'var(--ink-2)', display: 'grid', placeItems: 'center',
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}
          >
            <CloseIcon size={15} stroke={2} />
            {/* Invisible hit-area expansion to ~44px so the touch target meets
                the minimum without growing the visual button. */}
            <span aria-hidden="true" style={{ position: 'absolute', inset: -6, borderRadius: 14 }} />
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>خرید اشتراک</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.8 }}>
            برای فعال‌سازی اشتراک، مبلغ را کارت‌به‌کارت کنید و رسید را برای پشتیبانی بفرستید.
          </div>
        </div>

        {/* Guests must sign in first so the activation message carries their email. */}
        {!authed && (
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: 'var(--accent-deep)', lineHeight: 1.7,
            background: 'color-mix(in oklab, var(--accent) 10%, var(--card))',
            border: '1px solid color-mix(in oklab, var(--accent) 24%, transparent)',
            borderRadius: 12, padding: '10px 12px', marginTop: 12, textAlign: 'center',
          }}>
            برای فعال‌سازی اشتراک، ابتدا وارد حساب شوید.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {/* Plan selector: compact 3-option segmented control inside the amount card. */}
          <div style={rowStyle}>
            <div style={{ width: '100%' }}>
              <div style={labelStyle}>مبلغ اشتراک</div>
              <div role="radiogroup" aria-label="انتخاب مدت اشتراک" style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {PLANS.map(plan => {
                  const selected = plan.id === planId
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPlanId(plan.id)}
                      style={{
                        flex: 1, minWidth: 0, cursor: 'pointer', fontFamily: 'var(--font)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        padding: '7px 4px', borderRadius: 10,
                        border: selected
                          ? '1px solid color-mix(in oklab, var(--primary) 55%, transparent)'
                          : '1px solid var(--line)',
                        background: selected
                          ? 'color-mix(in oklab, var(--primary) 26%, var(--card))'
                          : 'color-mix(in oklab, var(--card) 55%, transparent)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: selected
                          ? '0 4px 14px color-mix(in oklab, var(--primary) 32%, transparent)'
                          : 'none',
                        color: selected ? 'var(--ink)' : 'var(--ink-3)',
                        transition: 'background .15s, border-color .15s, box-shadow .15s',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: selected ? 800 : 600 }}>{plan.label}</span>
                      <span className="zd-num" style={{ fontSize: 11.5, fontWeight: 800 }}>
                        {formatPriceNumber(String(plan.price))}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Card number + copy. */}
          {manualPayment.cardNumber && (
            <div style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={labelStyle}>شماره کارت</div>
                <div style={valueStyle}>{manualPayment.cardNumber}</div>
              </div>
              <button style={copyBtn} onClick={() => copy('card', manualPayment.cardNumber)}>
                {copied === 'card' ? 'کپی شد' : 'کپی'}
              </button>
            </div>
          )}

          {/* Account holder. */}
          {manualPayment.accountHolder && (
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>به نام</div>
                <div style={{ ...valueStyle, direction: 'rtl', textAlign: 'right' }}>{manualPayment.accountHolder}</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <button onClick={() => openUrl(manualPayment.telegramUrl)} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 50, fontSize: 14.5 }}>
            ارسال رسید در تلگرام
          </button>
          <button onClick={() => copy('msg', supportMessage)} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 46, fontSize: 14 }}>
            {copied === 'msg' ? 'متن پیام کپی شد' : 'کپی متن پیام پشتیبانی'}
          </button>

          {/* Combined trust + receipt instructions (M4D: merged from two texts). */}
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.8, textAlign: 'center', marginTop: 2 }}>
            بعد از واریز، متن پیام را کپی کنید و همراه تصویر رسید در تلگرام بفرستید تا اشتراک شما فعال شود.
          </div>
        </div>
      </div>
    </div>
  )
}
