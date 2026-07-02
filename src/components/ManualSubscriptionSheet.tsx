import React, { useState, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { manualPayment, hasPrice, formatPriceToman, formatPriceNumber } from '../config/manualPayment'
import { useDialog } from '../hooks/useDialog'

interface Props {
  onClose: () => void
}

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

  const priceText = formatPriceToman(manualPayment.priceToman)
  const priceNumber = formatPriceNumber(manualPayment.priceToman)

  // Prepared support message the user sends to support alongside the receipt.
  const supportMessage = [
    'سلام، من پرداخت اشتراک رانندگی‌یار را انجام دادم.',
    '',
    'ایمیل حساب کاربری:',
    email ?? '—',
    '',
    'مبلغ پرداختی:',
    priceNumber ? `${priceNumber} تومان` : '—',
    '',
    'نوع اشتراک:',
    'اشتراک یک‌ساله رانندگی‌یار',
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

        <div style={{ textAlign: 'center', marginBottom: 6 }}>
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
          {/* Price (or a safe placeholder when not configured). */}
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>مبلغ اشتراک</div>
              <div style={{ ...valueStyle, direction: 'rtl', textAlign: 'right' }}>
                {hasPrice ? priceText : 'مبلغ اشتراک در صفحه پرداخت اعلام می‌شود.'}
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

          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.8, textAlign: 'center', marginTop: 2 }}>
            بعد از واریز، لطفاً رسید پرداخت را در تلگرام برای پشتیبانی ارسال کنید.
            <br />
            برای فعال‌سازی سریع‌تر، ایمیل حساب کاربری داخل برنامه را هم ارسال کنید.
          </div>
          <button onClick={onClose} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 42, fontSize: 13, color: 'var(--ink-3)' }}>
            بستن
          </button>
        </div>
      </div>
    </div>
  )
}
