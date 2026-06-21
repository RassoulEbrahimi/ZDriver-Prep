// PHP backend entitlement client (PHP mode only).
//
// Returns a DISCRIMINATED result so the caller can tell a definitive server
// answer apart from a transient failure: only genuine network/unavailable
// failures may fall back to the offline-grace cache (S4C-1). A missing token,
// 401/403, or malformed response fails closed and must NOT use a stale cache.
//
// Never throws, never logs the token, no writes.

import { RY_API_BASE } from '../../config/backend'
import { getToken } from '../../auth/phpClient'
import { NO_ENTITLEMENT, type Entitlement } from './types'

interface PhpSubscription {
  active?: unknown
  plan?: unknown
  status?: unknown
  expiresAt?: unknown
  source?: unknown
}

export type PhpEntitlementReadResult =
  | { ok: true; entitlement: Entitlement }
  | { ok: false; reason: 'missing-token' | 'unauthorized' | 'network' | 'invalid-response' }

/** GET /subscription/me.php → discriminated result. Never throws. */
export async function readPhpEntitlement(): Promise<PhpEntitlementReadResult> {
  const token = getToken()
  if (!token) return { ok: false, reason: 'missing-token' }

  let res: Response
  try {
    res = await fetch(`${RY_API_BASE}/subscription/me.php`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    return { ok: false, reason: 'network' } // fetch/network/CORS failure
  }

  if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthorized' }
  // Server temporarily down (5xx) is treated as transient → grace may apply.
  if (res.status >= 500) return { ok: false, reason: 'network' }
  // Any other non-200 (e.g. 404/400/429) → definitive failure, fail closed.
  if (res.status !== 200) return { ok: false, reason: 'invalid-response' }

  let data: { ok?: boolean; subscription?: PhpSubscription }
  try {
    data = (await res.json()) as { ok?: boolean; subscription?: PhpSubscription }
  } catch {
    return { ok: false, reason: 'invalid-response' }
  }
  const sub = data?.subscription
  if (!sub || typeof sub !== 'object') return { ok: false, reason: 'invalid-response' }

  // Constrain to the values the Entitlement type allows; anything else dropped.
  const plan: Entitlement['plan'] = sub.plan === 'full' ? 'full' : 'none'
  const source =
    sub.source === 'manual' || sub.source === 'gateway' ? sub.source : undefined
  const expiresAt = typeof sub.expiresAt === 'string' ? sub.expiresAt : undefined

  if (sub.active === true && sub.status === 'active') {
    return { ok: true, entitlement: { active: true, plan, status: 'active', expiresAt, source } }
  }
  if (sub.status === 'canceled') {
    return { ok: true, entitlement: { active: false, plan, status: 'canceled', expiresAt, source } }
  }
  if (sub.status === 'expired') {
    return { ok: true, entitlement: { active: false, plan, status: 'expired', expiresAt, source } }
  }
  // Definitive "no subscription" (HTTP 200, none/unknown status) → fail closed.
  return { ok: true, entitlement: NO_ENTITLEMENT }
}
