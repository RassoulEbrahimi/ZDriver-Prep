// Phase 7B — Auth layer behind Firebase (Email/Password). UI consumes useAuth(),
// never firebase directly. Fail-soft: when Firebase is unavailable the provider
// reports status 'unavailable' and actions return a friendly Persian result.

import React, { createContext, useCallback, useEffect, useRef, useState } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { getAuthInstance, isFirebaseConfigured } from '../firebase/client'
import { authErrorMessage } from './authErrors'
import { ensureUserDoc } from '../data/progress/repo'
import { isPhpBackend } from '../config/backend'
import {
  phpRegister, phpLogin, phpMe, phpLogout,
  getToken, setToken, clearToken, PHP_RESET_DEFERRED,
} from './phpClient'

export type AuthStatus = 'loading' | 'guest' | 'authed' | 'unavailable'

export interface AuthUser {
  uid: string
  email: string | null
}

export type AuthResult = { ok: true } | { ok: false; message: string }

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  /** Whether Firebase auth is configured/available at all. */
  available: boolean
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  resetPassword: (email: string) => Promise<AuthResult>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const UNAVAILABLE: AuthResult = { ok: false, message: 'ورود فعلاً در دسترس نیست.' }

/**
 * Chooses the auth backend at build time (see src/config/backend.ts). Defaults
 * to Firebase, so a normal build is unaffected; PHP mode is opted into via
 * VITE_AUTH_PROVIDER=php. Both providers expose the same AuthContextValue, so
 * AuthSheet and every consumer work without knowing which backend is active.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return isPhpBackend
    ? <PhpAuthProvider>{children}</PhpAuthProvider>
    : <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
}

// ── PHP backend provider ───────────────────────────────────────────────────────
// Same AuthContextValue contract; talks to the standalone PHP/MySQL API via
// phpClient. The bearer token lives in localStorage; the session is restored on
// mount via /auth/me. signOut revokes server-side (best-effort) then drops the
// local token regardless of the API result.
function PhpAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? 'loading' : 'guest'))
  const [user, setUser]     = useState<AuthUser | null>(null)

  // Session restore: validate any stored token once on mount.
  useEffect(() => {
    const token = getToken()
    if (!token) return
    let alive = true
    void phpMe(token).then(u => {
      if (!alive) return
      if (u) { setUser(u); setStatus('authed') }
      else { clearToken(); setUser(null); setStatus('guest') }
    })
    return () => { alive = false }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const r = await phpRegister(email, password)
    if (!r.ok) return r
    setToken(r.token); setUser(r.user); setStatus('authed')
    return { ok: true }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const r = await phpLogin(email, password)
    if (!r.ok) return r
    setToken(r.token); setUser(r.user); setStatus('authed')
    return { ok: true }
  }, [])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const token = getToken()
    if (token) await phpLogout(token) // best-effort server-side revocation
    clearToken(); setUser(null); setStatus('guest')
    return { ok: true }
  }, [])

  // Password reset is deferred in PHP mode (no email flow yet).
  const resetPassword = useCallback(async (): Promise<AuthResult> => PHP_RESET_DEFERRED, [])

  const value: AuthContextValue = {
    status, user, available: true,
    signUpWithEmail, signInWithEmail, signOut, resetPassword,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Firebase provider (default / production) — logic unchanged ──────────────────
function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isFirebaseConfigured ? 'loading' : 'unavailable')
  const [user, setUser]     = useState<AuthUser | null>(null)

  // Tracks the uid we've already ensured a cloud user doc for, so the best-effort
  // write runs at most once per uid per session (dedupes onAuthStateChanged re-emits
  // and React StrictMode double-subscribes).
  const ensuredUidRef = useRef<string | null>(null)

  useEffect(() => {
    const auth = getAuthInstance()
    if (!auth) {
      setStatus('unavailable')
      return
    }
    let unsub = () => {}
    try {
      unsub = onAuthStateChanged(
        auth,
        u => {
          if (u) {
            setUser({ uid: u.uid, email: u.email }); setStatus('authed')
            // First Firestore write (Phase 7F): create/update users/{uid}.
            // Fire-and-forget and best-effort — never awaited, never blocks auth.
            if (ensuredUidRef.current !== u.uid) {
              ensuredUidRef.current = u.uid
              void ensureUserDoc(u.uid, u.email).catch(() => undefined)
            }
          } else {
            setUser(null); setStatus('guest')
            ensuredUidRef.current = null
          }
        },
        () => { setUser(null); setStatus('unavailable') },
      )
    } catch {
      setStatus('unavailable')
    }
    return () => unsub()
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const auth = getAuthInstance(); if (!auth) return UNAVAILABLE
    try { await createUserWithEmailAndPassword(auth, email.trim(), password); return { ok: true } }
    catch (e) { return { ok: false, message: authErrorMessage(e) } }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const auth = getAuthInstance(); if (!auth) return UNAVAILABLE
    try { await signInWithEmailAndPassword(auth, email.trim(), password); return { ok: true } }
    catch (e) { return { ok: false, message: authErrorMessage(e) } }
  }, [])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const auth = getAuthInstance(); if (!auth) return UNAVAILABLE
    try { await firebaseSignOut(auth); return { ok: true } }
    catch (e) { return { ok: false, message: authErrorMessage(e) } }
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const auth = getAuthInstance(); if (!auth) return UNAVAILABLE
    try { await sendPasswordResetEmail(auth, email.trim()); return { ok: true } }
    catch (e) { return { ok: false, message: authErrorMessage(e) } }
  }, [])

  const value: AuthContextValue = {
    status, user, available: isFirebaseConfigured,
    signUpWithEmail, signInWithEmail, signOut, resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
