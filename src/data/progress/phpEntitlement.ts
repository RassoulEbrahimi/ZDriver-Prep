// PHP backend entitlement client (PHP mode only). Fail-soft, fail-CLOSED read of
// the user's subscription from /subscription/me.php.
//
// Mirrors the Firestore readEntitlement() contract: it NEVER throws and never
// returns a failure shape — any problem (missing token, 401, network/CORS,
// malformed response) resolves to NO_ENTITLEMENT, so access is never unlocked on
// error. The backend already returns the normalized shape; we re-validate
// defensively rather than trust it.

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

/** GET /subscription/me.php → normalized Entitlement (fail-CLOSED). */
export async function readPhpEntitlement(): Promise<Entitlement> {
  const token = getToken()
  if (!token) return NO_ENTITLEMENT
  try {
    const res = await fetch(`${RY_API_BASE}/subscription/me.php`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) return NO_ENTITLEMENT
    const data = (await res.json()) as { ok?: boolean; subscription?: PhpSubscription }
    const sub = data?.subscription
    if (!sub || typeof sub !== 'object') return NO_ENTITLEMENT

    // Constrain to the values the Entitlement type allows; anything else dropped.
    const plan: Entitlement['plan'] = sub.plan === 'full' ? 'full' : 'none'
    const source =
      sub.source === 'manual' || sub.source === 'gateway' ? sub.source : undefined
    const expiresAt = typeof sub.expiresAt === 'string' ? sub.expiresAt : undefined

    if (sub.active === true && sub.status === 'active') {
      return { active: true, plan, status: 'active', expiresAt, source }
    }
    if (sub.status === 'canceled') {
      return { active: false, plan, status: 'canceled', expiresAt, source }
    }
    if (sub.status === 'expired') {
      return { active: false, plan, status: 'expired', expiresAt, source }
    }
    // 'none' / unknown / inactive → fail closed.
    return NO_ENTITLEMENT
  } catch {
    return NO_ENTITLEMENT
  }
}
