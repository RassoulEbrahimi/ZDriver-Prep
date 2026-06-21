// Entitlement consumption hook (read-only, non-blocking).
//
// Bridges auth state (useAuth) to the fail-closed entitlement read:
//   - Firebase/default mode → Firestore readEntitlement(uid) (unchanged; no cache)
//   - PHP mode → readPhpEntitlement() (discriminated result) + an offline-grace
//     cache (S4C-1) so an active subscriber is not locked when the API is briefly
//     unreachable. The live API is the source of truth whenever online.
//
// States:
//   'loading'     — auth still resolving, or the one-time read is in flight
//   'ready'       — entitlement resolved (guest → NO_ENTITLEMENT/free)
//   'unavailable' — Firebase unconfigured/unreachable (fail closed; app usable)

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { readEntitlement } from '../data/progress/repo'
import { readPhpEntitlement } from '../data/progress/phpEntitlement'
import {
  readActiveGrace, writeCachedEntitlement, clearCachedEntitlement,
} from '../data/entitlement/entitlementCache'
import { isPhpBackend } from '../config/backend'
import { NO_ENTITLEMENT, type Entitlement } from '../data/progress/types'

export type EntitlementStatus = 'loading' | 'ready' | 'unavailable'

export interface UseEntitlement {
  status: EntitlementStatus
  entitlement: Entitlement
  /** Force a fresh one-time read (e.g. after a manual activation). Optional. */
  refresh: () => void
}

export function useEntitlement(): UseEntitlement {
  const { status: authStatus, user } = useAuth()
  // Depend on the uid string (not the user object) so the one-time read runs
  // only when the signed-in user actually changes — not on auth re-emits.
  const uid = authStatus === 'authed' ? (user?.uid ?? null) : null

  const [status, setStatus] = useState<EntitlementStatus>('loading')
  const [entitlement, setEntitlement] = useState<Entitlement>(NO_ENTITLEMENT)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    // Auth still resolving.
    if (authStatus === 'loading') {
      setStatus('loading')
      return
    }
    // Firebase unconfigured/unreachable → fail closed, but the app stays usable.
    if (authStatus === 'unavailable') {
      setEntitlement(NO_ENTITLEMENT)
      setStatus('unavailable')
      return
    }
    // Guest / signed out → free, no entitlement. (Cache is never read in guest
    // state, so one account never inherits another's entitlement.)
    if (!uid) {
      setEntitlement(NO_ENTITLEMENT)
      setStatus('ready')
      return
    }

    let cancelled = false

    // ── PHP mode: offline-grace cache + discriminated live read ──────────────
    if (isPhpBackend) {
      // Seed synchronously from a valid active cache so a returning subscriber
      // doesn't see a lock flash; otherwise stay 'loading' until the read lands.
      const grace = readActiveGrace(uid)
      if (grace) { setEntitlement(grace); setStatus('ready') } else { setStatus('loading') }

      void readPhpEntitlement().then(res => {
        if (cancelled) return
        if (res.ok) {
          // Definitive server answer — update cache and use it as truth.
          setEntitlement(res.entitlement)
          setStatus('ready')
          if (res.entitlement.active && res.entitlement.status === 'active') {
            writeCachedEntitlement(uid, res.entitlement)
          } else {
            clearCachedEntitlement(uid) // downgrade → drop any stale active cache
          }
        } else if (res.reason === 'network') {
          // Transient/offline only — fall back to a valid active cache, else closed.
          setEntitlement(readActiveGrace(uid) ?? NO_ENTITLEMENT)
          setStatus('ready')
        } else {
          // missing-token / unauthorized / invalid-response → fail closed.
          if (res.reason === 'unauthorized') clearCachedEntitlement(uid)
          setEntitlement(NO_ENTITLEMENT)
          setStatus('ready')
        }
      })
      return () => { cancelled = true }
    }

    // ── Firebase/default mode (unchanged; no PHP cache) ──────────────────────
    setStatus('loading')
    void readEntitlement(uid).then(ent => {
      if (cancelled) return
      setEntitlement(ent)
      setStatus('ready')
    })
    return () => { cancelled = true }
  }, [authStatus, uid, refreshTick])

  // PHP mode: re-read entitlement when the app comes back online or becomes
  // visible again (e.g. after an admin activation), so unlock appears without a
  // manual reload. No polling, no realtime listener; listeners are cleaned up.
  useEffect(() => {
    if (!isPhpBackend || authStatus !== 'authed' || !uid) return
    const bump = () => setRefreshTick(t => t + 1)
    const onVisible = () => { if (document.visibilityState === 'visible') bump() }
    window.addEventListener('online', bump)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', bump)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [authStatus, uid])

  return { status, entitlement, refresh: () => setRefreshTick(t => t + 1) }
}
