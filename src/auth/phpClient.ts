// PHP backend auth client. Thin, never-throwing fetch wrapper around the
// standalone PHP/MySQL API at RY_API_BASE. Returns the same AuthResult/AuthUser
// shapes the rest of the app already uses — no Firebase types here.
//
// Token handling: the opaque 30-day bearer token is kept in localStorage so the
// session persists across reloads and app restarts (a PWA is opened repeatedly;
// sessionStorage would force a re-login on every cold start). Only a SHA-256 hash
// of the token is ever stored server-side. The password is never stored.

import type { AuthResult, AuthUser } from './AuthProvider'
import { RY_API_BASE } from '../config/backend'

const TOKEN_KEY = 'ry_php_auth_token'

// ── Token store (localStorage; fail-soft if storage is unavailable) ────────────
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* ignore */ }
}
export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

// ── Identity store (offline session restore) ───────────────────────────────────
// The last successfully-authenticated user's MINIMAL identity (uid + email only),
// so that when /auth/me fails purely because the device is offline we can keep
// the user signed in (and, critically, keep their uid for entitlement offline
// grace) instead of dropping to guest. Never stores the token, password, payment,
// or any other field. Paired with the token: set together on login, cleared
// together on logout / 401, so one account can never inherit another's identity.
const USER_KEY = 'ry_php_user'

export function setCachedUser(user: AuthUser): void {
  try { localStorage.setItem(USER_KEY, JSON.stringify({ uid: user.uid, email: user.email })) } catch { /* ignore */ }
}
export function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { uid?: unknown; email?: unknown }
    if (!v || typeof v.uid !== 'string' || v.uid === '') return null
    return { uid: v.uid, email: typeof v.email === 'string' ? v.email : null }
  } catch {
    try { localStorage.removeItem(USER_KEY) } catch { /* ignore */ }
    return null
  }
}
export function clearCachedUser(): void {
  try { localStorage.removeItem(USER_KEY) } catch { /* ignore */ }
}

// ── Error mapping (Persian), mirroring the style of authErrors.ts ──────────────
function messageForStatus(status: number, serverError?: string): string {
  switch (status) {
    case 0:   return 'اتصال برقرار نشد. اینترنت/فیلترشکن را بررسی کن.'
    case 401: return 'ایمیل یا رمز عبور درست نیست.'
    case 409: return 'این ایمیل قبلاً ثبت شده است. وارد شو.'
    case 422: return serverError || 'ایمیل یا رمز عبور معتبر نیست.'
    case 429: return 'تلاش‌های زیاد. کمی بعد دوباره امتحان کن.'
    default:  return 'مشکلی پیش آمد. دوباره امتحان کن.'
  }
}

interface ApiResponse {
  ok?: boolean
  error?: string
  token?: string
  user?: { id: number; email: string }
}

/**
 * Perform a JSON request against the PHP API. Returns the parsed body plus the
 * HTTP status. Network failures (incl. CORS/offline) surface as status 0. Never throws.
 */
async function apiFetch(
  path: string,
  init: { method: string; token?: string; body?: unknown },
): Promise<{ status: number; data: ApiResponse }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (init.token) headers['Authorization'] = `Bearer ${init.token}`
  try {
    const res = await fetch(`${RY_API_BASE}${path}`, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
    let data: ApiResponse = {}
    try { data = (await res.json()) as ApiResponse } catch { /* non-JSON / empty body */ }
    return { status: res.status, data }
  } catch {
    return { status: 0, data: {} }
  }
}

function toAuthUser(user?: { id: number; email: string }): AuthUser | null {
  if (!user) return null
  return { uid: String(user.id), email: user.email }
}

export type PhpAuthOutcome =
  | { ok: true; token: string; user: AuthUser }
  | { ok: false; message: string }

/** Register a new account → fresh bearer token + user on success (HTTP 201). */
export async function phpRegister(email: string, password: string): Promise<PhpAuthOutcome> {
  const { status, data } = await apiFetch('/auth/register.php', {
    method: 'POST',
    body: { email: email.trim(), password },
  })
  const user = toAuthUser(data.user)
  if (status === 201 && data.token && user) return { ok: true, token: data.token, user }
  return { ok: false, message: messageForStatus(status, data.error) }
}

/** Log in → fresh bearer token + user on success (HTTP 200). */
export async function phpLogin(email: string, password: string): Promise<PhpAuthOutcome> {
  const { status, data } = await apiFetch('/auth/login.php', {
    method: 'POST',
    body: { email: email.trim(), password },
  })
  const user = toAuthUser(data.user)
  if (status === 200 && data.token && user) return { ok: true, token: data.token, user }
  return { ok: false, message: messageForStatus(status, data.error) }
}

/** Validate the stored token and resolve the current user (session restore). */
export type PhpMeResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'missing-token' | 'unauthorized' | 'network' | 'invalid-response' }

/**
 * Validate the stored token and resolve the current user (session restore).
 * Discriminated so the caller can tell a transient offline/unreachable failure
 * (→ keep the session via cached identity) apart from a genuine 401/403
 * (→ sign out). Never throws.
 */
export async function phpMe(token: string): Promise<PhpMeResult> {
  if (!token) return { ok: false, reason: 'missing-token' }
  const { status, data } = await apiFetch('/auth/me.php', { method: 'GET', token })
  if (status === 0 || status >= 500) return { ok: false, reason: 'network' }      // offline/CORS/server down
  if (status === 401 || status === 403) return { ok: false, reason: 'unauthorized' }
  if (status === 200) {
    const user = toAuthUser(data.user)
    return user ? { ok: true, user } : { ok: false, reason: 'invalid-response' }
  }
  return { ok: false, reason: 'invalid-response' }
}

/**
 * Server-side logout (best-effort token revocation). Never throws and ignores the
 * result — the caller clears the local token regardless of API outcome.
 */
export async function phpLogout(token: string): Promise<void> {
  await apiFetch('/auth/logout.php', { method: 'POST', token })
}

/** Friendly result for the deferred reset-password path in PHP mode. */
export const PHP_RESET_DEFERRED: AuthResult = {
  ok: false,
  message: 'بازیابی رمز عبور در این نسخه هنوز فعال نیست.',
}
