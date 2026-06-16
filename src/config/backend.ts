// Backend selection (test-build only). Single source of truth for choosing the
// auth/progress backend at build time. Defaults to Firebase so production builds
// — which leave VITE_AUTH_PROVIDER unset — are completely unaffected.
//
// The PHP path is a temporary Iran-reachability pilot against the standalone
// PHP/MySQL backend at VITE_RY_API_BASE. See the pilot README in the
// ranandegiyar-api package.

export type BackendMode = 'firebase' | 'php'

/** 'php' only when explicitly opted in via env; everything else stays 'firebase'. */
export const BACKEND_MODE: BackendMode =
  import.meta.env.VITE_AUTH_PROVIDER === 'php' ? 'php' : 'firebase'

/** Base URL of the PHP pilot API, trailing slash stripped. Empty in production. */
export const RY_API_BASE: string = (import.meta.env.VITE_RY_API_BASE ?? '').replace(/\/+$/, '')

/** True when the app is wired to the PHP pilot backend instead of Firebase. */
export const isPhpBackend = BACKEND_MODE === 'php'
