// Backend selection (build-time). Single source of truth for choosing the auth
// backend. Defaults to Firebase, so a normal build — which leaves
// VITE_AUTH_PROVIDER unset — is completely unaffected. PHP mode targets the
// standalone PHP/MySQL API and is opted into explicitly per build/env.
//
// Production cPanel (later) builds with:
//   VITE_AUTH_PROVIDER=php
//   VITE_RY_API_BASE=https://nazarimaison.art/ranandegiyar-api
//
// No secrets and no hardcoded app URLs live here — the API base is public and
// the bearer token is issued at runtime.

export type BackendMode = 'firebase' | 'php'

/** 'php' only when explicitly opted in via env; everything else stays 'firebase'. */
export const BACKEND_MODE: BackendMode =
  import.meta.env.VITE_AUTH_PROVIDER === 'php' ? 'php' : 'firebase'

/** Base URL of the PHP API, trailing slash(es) stripped. Empty when unset. */
export const RY_API_BASE: string = (import.meta.env.VITE_RY_API_BASE ?? '').replace(/\/+$/, '')

/** True when the app is wired to the PHP backend instead of Firebase. */
export const isPhpBackend = BACKEND_MODE === 'php'

// Safe misconfiguration guard: PHP mode without an API base would make every
// auth call fail. We do NOT throw (the app must still load and stay usable as a
// guest); we surface a one-time console warning so the build is easy to debug.
if (isPhpBackend && RY_API_BASE === '') {
  console.warn(
    '[backend] VITE_AUTH_PROVIDER=php but VITE_RY_API_BASE is empty — ' +
    'PHP auth calls will fail. Set VITE_RY_API_BASE to the API base URL.',
  )
}
