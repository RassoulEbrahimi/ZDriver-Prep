// PHP pilot backend progress client (test build only). Fail-soft blob save/load
// against the standalone PHP/MySQL API. Mirrors the repo.ts contract: every call
// returns a result object and never throws.
//
// For the pilot the whole progress snapshot is stored as one JSON blob per user
// (matching the backend's one-row-per-user model). Faithful per-exam round-trip
// is intentionally out of scope; the goal is to prove save/load works over the
// network from Iran.

import { RY_API_BASE } from '../../config/backend'
import { getToken } from '../../auth/phpClient'

/** The progress blob shape exchanged with /progress/save.php and /progress/load.php. */
export interface PhpProgressPayload {
  summary: unknown | null
  examProgress: unknown | null
  examAttempts: unknown | null
  bookmarks: string[] | null
  wrongQuestionIds: string[] | null
}

export type PhpSaveResult = { ok: true } | { ok: false; reason: 'unauthed' | 'error' }
export type PhpLoadResult =
  | { ok: true; progress: PhpProgressPayload; updatedAt: string | null }
  | { ok: false; reason: 'unauthed' | 'error' }

/** Save the full progress blob for the authenticated user. Never throws. */
export async function savePhpProgress(payload: PhpProgressPayload): Promise<PhpSaveResult> {
  const token = getToken()
  if (!token) return { ok: false, reason: 'unauthed' }
  try {
    const res = await fetch(`${RY_API_BASE}/progress/save.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    if (res.status === 200) return { ok: true }
    return { ok: false, reason: res.status === 401 ? 'unauthed' : 'error' }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/** Load the saved progress blob, or an empty/default object if none exists. Never throws. */
export async function loadPhpProgress(): Promise<PhpLoadResult> {
  const token = getToken()
  if (!token) return { ok: false, reason: 'unauthed' }
  try {
    const res = await fetch(`${RY_API_BASE}/progress/load.php`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) return { ok: false, reason: res.status === 401 ? 'unauthed' : 'error' }
    const data = (await res.json()) as { ok?: boolean; progress?: Partial<PhpProgressPayload>; updatedAt?: string | null }
    const p = data.progress ?? {}
    return {
      ok: true,
      progress: {
        summary: p.summary ?? null,
        examProgress: p.examProgress ?? null,
        examAttempts: p.examAttempts ?? null,
        bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks : null,
        wrongQuestionIds: Array.isArray(p.wrongQuestionIds) ? p.wrongQuestionIds : null,
      },
      updatedAt: data.updatedAt ?? null,
    }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
