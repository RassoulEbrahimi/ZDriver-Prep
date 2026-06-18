// PHP pilot backend auth client (test build only). Thin fetch wrapper around the
// standalone PHP/MySQL API at RY_API_BASE. No Firebase types here; this module
// returns the same AuthResult/AuthUser shapes the rest of the app already uses.
//
// Token handling: the opaque 30-day bearer token is kept in sessionStorage so the
// session survives a reload but clears when the tab closes (smaller XSS exposure
// window than localStorage). Only a SHA-256 hash of the token is ever stored
// server-side. There is no server-side revocation in the pilot — signing out just
// drops the local token; it remains valid until it expires.

import type { AuthResult, AuthUser } from './AuthProvider'
import { RY_API_BASE } from '../config/backend'

const TOKEN_KEY = 'ranandegiyar:php:token'

// ── Token store (sessionStorage; fail-soft if storage is unavailable) ──────────
export function getToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token: string): void {
  try { sessionStorage.setItem(TOKEN_KEY, token) } catch { /* ignore */ }
}
export function clearToken(): void {
  try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
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
 * HTTP status. Network failures surface as status 0. Never throws.
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
    try { data = (await res.json()) as ApiResponse } catch { /* non-JSON / empty */ }
    return { status: res.status, data }
  } catch {
    return { status: 0, data: {} }
  }
}

function toAuthUser(user?: { id: number; email: string }): AuthUser | null {
  if (!user) return null
  return { uid: String(user.id), email: user.email }
}

export type PhpAuthSuccess = { ok: true; token: string; user: AuthUser }
export type PhpAuthOutcome = PhpAuthSuccess | { ok: false; message: string }

/** Register a new account → returns a fresh bearer token + user on success. */
export async function phpRegister(email: string, password: string): Promise<PhpAuthOutcome> {
  const { status, data } = await apiFetch('/auth/register.php', {
    method: 'POST',
    body: { email: email.trim(), password },
  })
  const user = toAuthUser(data.user)
  if (status === 201 && data.token && user) return { ok: true, token: data.token, user }
  return { ok: false, message: messageForStatus(status, data.error) }
}

/** Log in → returns a fresh bearer token + user on success. */
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
export async function phpMe(token: string): Promise<AuthUser | null> {
  const { status, data } = await apiFetch('/auth/me.php', { method: 'GET', token })
  if (status === 200) return toAuthUser(data.user)
  return null
}

/** Friendly result used by the deferred reset-password path in PHP mode. */
export const PHP_RESET_DEFERRED: AuthResult = {
  ok: false,
  message: 'بازیابی رمز در نسخه آزمایشی فعال نیست.',
}
