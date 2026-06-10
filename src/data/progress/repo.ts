// Phase 7E — Cloud progress write repository (best-effort, fail-soft, NO callers).
//
// A thin write layer over Firestore for the Phase 7C model. Every function is
// best-effort and NEVER throws: it returns a WriteResult instead. Firestore is
// the additive cloud mirror only — localStorage/in-memory Progress stays the
// runtime source of truth. The Firestore write APIs are loaded via a dynamic
// import so the SDK stays in the lazy code-split chunk; nothing imports this
// module at runtime yet, so it tree-shakes out of production entirely.
//
// Inputs are plain app-level objects; this module maps them to Firestore docs.
// No reads, no listeners, no offline persistence, no questionProgress writes.

import type { Firestore } from 'firebase/firestore'
import { getDb } from '../../firebase/client'
import {
  SCHEMA_VERSION,
  userPath, summaryPath, examProgressPath, examAttemptsPath, bookmarksPath,
} from './types'

export type WriteResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'unauthed' | 'error'; message?: string }

const UNAUTHED: WriteResult    = { ok: false, reason: 'unauthed' }
const UNAVAILABLE: WriteResult = { ok: false, reason: 'unavailable' }

function fail(e: unknown): WriteResult {
  const message = e instanceof Error ? e.message : String(e)
  if (import.meta.env.DEV) console.debug('[progress repo] write failed:', e)
  return { ok: false, reason: 'error', message }
}

/** Type of the lazily-imported Firestore module (type-only; erased at build). */
type Fs = typeof import('firebase/firestore')

/**
 * Resolve { db, fs } or a failure WriteResult. Distinguish at the call-site with
 * `'ok' in ctx` (a WriteResult has `ok`; the success context does not).
 */
async function ctx(uid: string): Promise<{ db: Firestore; fs: Fs } | WriteResult> {
  if (!uid) return UNAUTHED
  let db: Firestore | null
  try {
    db = await getDb()
  } catch (e) {
    return fail(e)
  }
  if (!db) return UNAVAILABLE
  try {
    const fs = await import('firebase/firestore')
    return { db, fs }
  } catch (e) {
    return fail(e)
  }
}

// ── Inputs (plain app-level objects) ────────────────────────────────────────

export interface ProgressSummaryInput {
  totalAnswered?: number
  totalCorrect?: number
  totalWrong?: number
  weakCount?: number
  bookmarkCount?: number
  completedExamsCount?: number
  passedExamsCount?: number
  readiness?: number
}

export interface ExamProgressInput {
  examId: number
  official?: boolean
  answeredIds?: string[]      // arrayUnion
  correctIds?: string[]       // arrayUnion
  wrongIds?: string[]         // arrayUnion
  removeWrongIds?: string[]   // arrayRemove (pruned when now-correct) — separate write
  lastQuestionIndex?: number
  bestScore?: number
  lastScore?: number
  passed?: boolean
  touchPracticedAt?: boolean  // set lastPracticedAt = serverTimestamp()
  touchAttemptAt?: boolean    // set lastAttemptAt   = serverTimestamp()
}

export interface ExamAttemptInput {
  examId: number
  score: number
  totalQuestions: number
  passed: boolean
  durationSeconds?: number
  wrongIds?: string[]
}

// ── Write functions ─────────────────────────────────────────────────────────

/** users/{uid} — idempotent profile upsert. (createdAt may refresh on repeat
 *  calls; a create-only guarantee can be added later via a transaction.) */
export async function ensureUserDoc(uid: string, email?: string | null): Promise<WriteResult> {
  const c = await ctx(uid)
  if ('ok' in c) return c
  const { db, fs } = c
  try {
    await fs.setDoc(fs.doc(db, userPath(uid)), {
      uid,
      email: email ?? null,
      schemaVersion: SCHEMA_VERSION,
      createdAt: fs.serverTimestamp(),
      updatedAt: fs.serverTimestamp(),
    }, { merge: true })
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** users/{uid}/summary/main — denormalized totals (merge; scalars only). */
export async function writeProgressSummary(uid: string, summary: ProgressSummaryInput): Promise<WriteResult> {
  const c = await ctx(uid)
  if ('ok' in c) return c
  const { db, fs } = c
  try {
    const update: Record<string, unknown> = { updatedAt: fs.serverTimestamp() }
    const keys: (keyof ProgressSummaryInput)[] = [
      'totalAnswered', 'totalCorrect', 'totalWrong', 'weakCount',
      'bookmarkCount', 'completedExamsCount', 'passedExamsCount', 'readiness',
    ]
    for (const k of keys) if (summary[k] !== undefined) update[k] = summary[k]
    await fs.setDoc(fs.doc(db, summaryPath(uid)), update, { merge: true })
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** users/{uid}/examProgress/{examId} — per-exam practice + best/last (merge;
 *  arrays via arrayUnion/arrayRemove so full arrays are never overwritten). */
export async function writeExamProgress(uid: string, p: ExamProgressInput): Promise<WriteResult> {
  const c = await ctx(uid)
  if ('ok' in c) return c
  const { db, fs } = c
  try {
    const ref = fs.doc(db, examProgressPath(uid, p.examId))
    const update: Record<string, unknown> = { examId: p.examId, updatedAt: fs.serverTimestamp() }
    if (p.official !== undefined)          update.official = p.official
    if (p.answeredIds?.length)             update.answeredQuestionIds = fs.arrayUnion(...p.answeredIds)
    if (p.correctIds?.length)              update.correctQuestionIds  = fs.arrayUnion(...p.correctIds)
    if (p.wrongIds?.length)                update.wrongQuestionIds    = fs.arrayUnion(...p.wrongIds)
    if (p.lastQuestionIndex !== undefined) update.lastQuestionIndex   = p.lastQuestionIndex
    if (p.bestScore !== undefined)         update.bestScore           = p.bestScore
    if (p.lastScore !== undefined)         update.lastScore           = p.lastScore
    if (p.passed !== undefined)            update.passed              = p.passed
    if (p.touchPracticedAt)                update.lastPracticedAt     = fs.serverTimestamp()
    if (p.touchAttemptAt)                  update.lastAttemptAt       = fs.serverTimestamp()
    await fs.setDoc(ref, update, { merge: true })

    // Prune now-correct ids from wrongQuestionIds in a separate write
    // (a field cannot take two array transforms in one update).
    if (p.removeWrongIds?.length) {
      await fs.setDoc(ref, {
        wrongQuestionIds: fs.arrayRemove(...p.removeWrongIds),
        updatedAt: fs.serverTimestamp(),
      }, { merge: true })
    }
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** users/{uid}/examAttempts/{auto} — append-only attempt. */
export async function appendExamAttempt(uid: string, attempt: ExamAttemptInput): Promise<WriteResult> {
  const c = await ctx(uid)
  if ('ok' in c) return c
  const { db, fs } = c
  try {
    const data: Record<string, unknown> = {
      examId: attempt.examId,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      passed: attempt.passed,
      finishedAt: fs.serverTimestamp(),
    }
    if (attempt.durationSeconds !== undefined) data.durationSeconds = attempt.durationSeconds
    if (attempt.wrongIds?.length)              data.wrongQuestionIds = attempt.wrongIds
    await fs.addDoc(fs.collection(db, examAttemptsPath(uid)), data)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** users/{uid}/bookmarks/main — add/remove bookmarked question ids. */
export async function writeBookmarks(uid: string, changes: { add?: string[]; remove?: string[] }): Promise<WriteResult> {
  const c = await ctx(uid)
  if ('ok' in c) return c
  const { db, fs } = c
  try {
    const ref = fs.doc(db, bookmarksPath(uid))
    // Separate writes so add/remove never apply two transforms to one field.
    if (changes.remove?.length) {
      await fs.setDoc(ref, { questionIds: fs.arrayRemove(...changes.remove), updatedAt: fs.serverTimestamp() }, { merge: true })
    }
    if (changes.add?.length) {
      await fs.setDoc(ref, { questionIds: fs.arrayUnion(...changes.add), updatedAt: fs.serverTimestamp() }, { merge: true })
    }
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}
