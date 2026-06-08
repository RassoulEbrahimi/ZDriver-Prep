// Phase 5C — App-level theme controller (pure, no React).
//
// Drives the existing CSS palettes via `data-theme` on <html>:
//   - data-theme="dark"  → the [data-theme="dark"] token block in index.css
//   - data-theme="light" → falls through to :root (the default light tokens)
// Also keeps <meta name="theme-color"> in sync for the mobile/PWA status bar.

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const STORAGE_KEY = 'zd-theme'

/** Status-bar colors per resolved theme (light keeps the existing purple). */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#4B3A8C',
  dark:  '#16142A',
}

const isMode = (v: unknown): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark'

/** Read the persisted mode; missing/invalid/unavailable → 'system'. */
export function getStoredMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isMode(raw) ? raw : 'system'
  } catch {
    return 'system'
  }
}

/** Persist the mode. Never throws (e.g. private mode). */
export function setStoredMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* storage unavailable — ignore */
  }
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

/** Resolve a mode to a concrete theme. 'system' follows the device. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

/**
 * Apply a mode to the document: set data-theme on <html> and sync the
 * theme-color meta. Returns the resolved theme. Safe to call repeatedly.
 */
export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(mode)
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)

  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', THEME_COLOR[resolved])

  return resolved
}

/**
 * Subscribe to OS/browser color-scheme changes. Returns an unsubscribe fn.
 * Callers should re-apply only while the active mode is 'system'.
 */
export function subscribeSystem(callback: () => void): () => void {
  let mql: MediaQueryList
  try {
    mql = window.matchMedia('(prefers-color-scheme: dark)')
  } catch {
    return () => {}
  }
  const handler = () => callback()
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }
  // Legacy Safari / older browsers
  mql.addListener(handler)
  return () => mql.removeListener(handler)
}
