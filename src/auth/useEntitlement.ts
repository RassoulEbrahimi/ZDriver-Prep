// Phase S2 — Entitlement consumption hook (read-only, non-blocking).
//
// Bridges auth state (useAuth) to the fail-closed Firestore read added in S1
// (readEntitlement). It performs a SINGLE one-time read per signed-in uid — no
// realtime listener, no writes, no localStorage. Entitlement is NEVER used to
// unlock anything in this phase; it only feeds a status display.
//
// States:
//   'loading'     — auth still resolving, or the one-time read is in flight
//   'ready'       — entitlement resolved (guest → NO_ENTITLEMENT/free)
//   'unavailable' — Firebase unconfigured/unreachable (fail closed; app usable)

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { readEntitlement } from '../data/progress/repo'
import { readPhpEntitlement } from '../data/progress/phpEntitlement'
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
    // Guest / signed out → free, no entitlement.
    if (!uid) {
      setEntitlement(NO_ENTITLEMENT)
      setStatus('ready')
      return
    }
    // Authed: one-time fail-closed read. readEntitlement never throws and never
    // unlocks on error, so no try/catch is needed here.
    // Source switch: PHP mode reads /subscription/me.php; default Firebase mode
    // keeps the Firestore readEntitlement(uid). Both are fail-closed and never
    // throw, so the result can be consumed directly.
    let cancelled = false
    setStatus('loading')
    const read = isPhpBackend ? readPhpEntitlement() : readEntitlement(uid)
    void read.then(ent => {
      if (cancelled) return
      setEntitlement(ent)
      setStatus('ready')
    })
    return () => { cancelled = true }
  }, [authStatus, uid, refreshTick])

  return { status, entitlement, refresh: () => setRefreshTick(t => t + 1) }
}
