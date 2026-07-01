import React, { useState, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { isPhpBackend } from '../config/backend'
import { fa } from '../utils'
import { useDialog } from '../hooks/useDialog'

// PHP backend requires >= 8 chars; Firebase keeps its existing >= 6 so default
// (Firebase) behavior is unchanged.
const MIN_PASSWORD_LEN = isPhpBackend ? 8 : 6

interface Props {
  onClose: () => void
}

type Mode = 'login' | 'signup'

const inputStyle: React.CSSProperties = {
  width: '100%', height: 48, borderRadius: 12, padding: '0 14px',
  background: 'var(--card-2)', border: '1px solid var(--line)',
  color: 'var(--ink)', fontFamily: 'var(--font)', fontSize: 15,
  outline: 'none', direction: 'ltr', textAlign: 'left',
}

/**
 * Phase 7B — Persian RTL auth/account bottom sheet. Reuses existing zd-sheet
 * styling and CSS tokens (Light/Dark/RTL automatic). No progress sync.
 */
export function AuthSheet({ onClose }: Props) {
  const { status, user, signUpWithEmail, signInWithEmail, signOut, resetPassword } = useAuth()

  const [mode, setMode]       = useState<Mode>('login')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function reset() { setError(null); setSuccess(null) }

  const validEmail = (e: string) => /\S+@\S+\.\S+/.test(e.trim())

  async function handleSubmit() {
    reset()
    if (!validEmail(email)) { setError('ایمیل وارد شده معتبر نیست.'); return }
    if (password.length < MIN_PASSWORD_LEN) { setError(`رمز عبور باید حداقل ${fa(MIN_PASSWORD_LEN)} نویسه باشد.`); return }
    setBusy(true)
    const res = mode === 'signup'
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password)
    setBusy(false)
    if (!res.ok) setError(res.message)
    else setPass('')
    // On success, onAuthStateChanged flips status → 'authed' and the sheet
    // re-renders to the signed-in view automatically.
  }

  async function handleReset() {
    reset()
    if (!validEmail(email)) { setError('برای بازیابی، ابتدا ایمیل را وارد کن.'); return }
    setBusy(true)
    const res = await resetPassword(email)
    setBusy(false)
    if (!res.ok) setError(res.message)
    else setSuccess('ایمیل بازیابی رمز عبور ارسال شد.')
  }

  async function handleSignOut() {
    reset(); setBusy(true)
    const res = await signOut()
    setBusy(false)
    if (!res.ok) setError(res.message)
  }

  const segBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700,
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? '#fff' : 'var(--ink-3)',
  })

  const sheetRef = useRef<HTMLDivElement>(null)
  useDialog(sheetRef, onClose)

  return (
    <div className="zd-backdrop" onClick={onClose}>
      <div ref={sheetRef} className="zd-sheet" role="dialog" aria-modal="true" aria-label="حساب کاربری" onClick={e => e.stopPropagation()}>
        <div className="zd-sheet-grip" />

        {/* ── Unavailable ── */}
        {status === 'unavailable' && (
          <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>حساب کاربری</div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 10, lineHeight: 1.8 }}>
              اتصال به سرویس ورود برقرار نشد. اگر در ایران هستی، اینترنت یا فیلترشکن پایدار را بررسی کن. می‌توانی فعلاً بدون حساب ادامه بدهی؛ پیشرفت مهمان فقط روی همین دستگاه ذخیره می‌شود.
            </div>
            <button onClick={onClose} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 46, marginTop: 18, fontSize: 14 }}>
              بستن
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '20px 4px' }}>
            <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>در حال بررسی حساب…</div>
          </div>
        )}

        {/* ── Signed in ── */}
        {status === 'authed' && user && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>حساب من</div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8, direction: 'ltr' }}>{user.email}</div>
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'center', marginTop: 10 }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
              <button onClick={handleSignOut} disabled={busy} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 50, fontSize: 15 }}>
                خروج از حساب
              </button>
              <button onClick={onClose} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 46, fontSize: 14 }}>
                بستن
              </button>
            </div>
          </div>
        )}

        {/* ── Guest: login / signup ── */}
        {status === 'guest' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>ورود / ثبت‌نام</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>
                برای ذخیرهٔ پیشرفت، وارد شو یا حساب بساز.
              </div>
            </div>

            {/* segmented */}
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--card-2)', border: '1px solid var(--line)', marginBottom: 14 }}>
              <button style={segBtn(mode === 'login')}  onClick={() => { setMode('login');  reset() }}>ورود</button>
              <button style={segBtn(mode === 'signup')} onClick={() => { setMode('signup'); reset() }}>ثبت‌نام</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email" inputMode="email" autoComplete="email" placeholder="ایمیل"
                value={email} onChange={e => { setEmail(e.target.value); reset() }} style={inputStyle}
              />
              <input
                type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="رمز عبور"
                value={password} onChange={e => { setPass(e.target.value); reset() }} style={inputStyle}
              />
            </div>

            {error   && <div style={{ fontSize: 13, color: 'var(--danger)',  marginTop: 10, lineHeight: 1.6 }}>{error}</div>}
            {success && <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 10, lineHeight: 1.6 }}>{success}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button onClick={handleSubmit} disabled={busy} className="zd-btn zd-btn-primary zd-btn-block"
                      style={{ height: 50, fontSize: 15, opacity: busy ? 0.6 : 1 }}>
                {busy ? 'لطفاً صبر کن…' : (mode === 'signup' ? 'ساخت حساب' : 'ورود')}
              </button>
              {!isPhpBackend && (
                <button onClick={handleReset} disabled={busy} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 44, fontSize: 13 }}>
                  فراموشی رمز عبور
                </button>
              )}
              <button onClick={onClose} className="zd-btn zd-btn-ghost zd-btn-block" style={{ height: 42, fontSize: 13, color: 'var(--ink-3)' }}>
                بستن
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
