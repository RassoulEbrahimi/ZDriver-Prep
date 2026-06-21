// S4C-1 — last-known PHP entitlement cache (offline grace). PHP mode only.
//
// Stores ONLY non-sensitive entitlement fields, scoped per authenticated uid, so
// an active paying user is not locked out when the subscription API is briefly
// unreachable. The live API is always the source of truth when online; this is a
// fallback + a synchronous seed to avoid the returning-subscriber lock flash.
//
// NEVER stores tokens, passwords, payment, or admin data. Every function is
// defensive and never throws.

import type { Entitlement } from '../progress/types'

const KEY_PREFIX = 'ry_entitlement:php:'

interface CachedEntitlement {
  active: boolean
  plan: string
  status: string
  expiresAt: string | null
  source: string | null
  cachedAt: number
}

const keyFor = (uid: string): string => `${KEY_PREFIX}${uid}`

/** Read + defensively validate the cached entitlement for a uid. null on any problem. */
export function readCachedEntitlement(uid: string): CachedEntitlement | null {
  if (!uid) return null
  try {
    const raw = localStorage.getItem(keyFor(uid))
    if (!raw) return null
    const v = JSON.parse(raw) as Record<string, unknown>
    if (!v || typeof v !== 'object') return null
    if (typeof v.active !== 'boolean' || typeof v.status !== 'string') return null
    return {
      active: v.active,
      plan: typeof v.plan === 'string' ? v.plan : 'none',
      status: v.status,
      expiresAt: typeof v.expiresAt === 'string' ? v.expiresAt : null,
      source: typeof v.source === 'string' ? v.source : null,
      cachedAt: typeof v.cachedAt === 'number' ? v.cachedAt : 0,
    }
  } catch {
    // Corrupt JSON / storage error → best-effort remove; never throw.
    try { localStorage.removeItem(keyFor(uid)) } catch { /* ignore */ }
    return null
  }
}

/** Persist only the non-sensitive entitlement fields for a uid. Never throws. */
export function writeCachedEntitlement(uid: string, ent: Entitlement): void {
  if (!uid) return
  try {
    const value: CachedEntitlement = {
      active: ent.active,
      plan: ent.plan,
      status: ent.status,
      expiresAt: ent.expiresAt ?? null,
      source: ent.source ?? null,
      cachedAt: Date.now(),
    }
    localStorage.setItem(keyFor(uid), JSON.stringify(value))
  } catch { /* ignore */ }
}

export function clearCachedEntitlement(uid: string): void {
  if (!uid) return
  try { localStorage.removeItem(keyFor(uid)) } catch { /* ignore */ }
}

/**
 * Offline-grace read: returns an ACTIVE Entitlement for the uid only when the
 * cached value is genuinely active and not past its expiry; otherwise null.
 * Expired or malformed cache never unlocks content.
 */
export function readActiveGrace(uid: string): Entitlement | null {
  const c = readCachedEntitlement(uid)
  if (!c) return null
  if (c.active !== true || c.status !== 'active') return null
  if (!c.expiresAt) return null
  const exp = Date.parse(c.expiresAt)
  if (Number.isNaN(exp) || exp <= Date.now()) return null
  return {
    active: true,
    plan: c.plan === 'full' ? 'full' : 'none',
    status: 'active',
    expiresAt: c.expiresAt,
    source: c.source === 'manual' || c.source === 'gateway' ? c.source : undefined,
  }
}
