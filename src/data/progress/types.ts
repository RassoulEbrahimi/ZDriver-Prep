// Phase 7D — Cloud progress TypeScript types (types only; no Firestore runtime).
//
// These describe the Firestore documents designed in Phase 7C. Nothing here
// imports a Firestore *runtime* API — `Timestamp` is a type-only import that is
// erased at build, so this module adds zero bundle weight and no Firestore
// dependency. No reads/writes happen in Phase 7D.

import type { Timestamp } from 'firebase/firestore'

/** Bump when the on-disk cloud shape changes (for future migrations). */
export const SCHEMA_VERSION = 1

// ── Documents ──────────────────────────────────────────────────────────────

/** users/{uid} — profile + pointers. */
export interface UserDoc {
  uid: string
  email: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  lastActivityAt?: Timestamp
  lastPracticeExamId?: number
  lastExamId?: number
  schemaVersion?: number
  /** Server/admin-owned entitlement (clients read-only; see Subscription). */
  subscription?: Subscription
}

/**
 * users/{uid}.subscription — server/admin-owned full-access entitlement.
 *
 * Activation is manual/admin for the MVP (Firebase Console / Admin SDK); the
 * client can READ this field but can NEVER create or modify it (enforced by
 * firestore.rules). The client must never grant itself access.
 */
export interface Subscription {
  plan: 'full'
  status: 'active' | 'expired' | 'canceled'
  startsAt: Timestamp
  expiresAt: Timestamp
  source: 'manual' | 'gateway'
  note?: string
  updatedAt: Timestamp
}

/** users/{uid}/summary/main — denormalized totals for cheap Home/Progress reads. */
export interface ProgressSummary {
  totalAnswered: number
  totalCorrect: number
  totalWrong: number
  weakCount?: number
  bookmarkCount?: number
  completedExamsCount?: number
  passedExamsCount?: number
  readiness?: number // 0–100, derived
  updatedAt: Timestamp
}

/** users/{uid}/examProgress/{examId} — per-exam practice + best/last (bounded arrays). */
export interface ExamProgress {
  examId: number
  official?: boolean
  answeredQuestionIds: string[]
  correctQuestionIds: string[]
  wrongQuestionIds: string[] // currently-wrong (pruned on later-correct)
  lastQuestionIndex?: number
  practiceCount?: number
  lastPracticedAt?: Timestamp
  bestScore?: number
  lastScore?: number
  passed?: boolean
  lastAttemptAt?: Timestamp
  updatedAt: Timestamp
}

/** users/{uid}/examAttempts/{attemptId} — append-only exam history. */
export interface ExamAttempt {
  examId: number
  score: number
  totalQuestions: number
  passed: boolean
  durationSeconds?: number
  startedAt?: Timestamp
  finishedAt: Timestamp
  wrongQuestionIds?: string[]
}

/** users/{uid}/bookmarks/main — bookmarked question ids. */
export interface Bookmarks {
  questionIds: string[]
  updatedAt: Timestamp
}

/**
 * users/{uid}/questionProgress/{questionId} — DEFERRED / designed only.
 * Not used by the MVP (weak/review is derived from per-exam wrong arrays +
 * bookmarks). Kept here so the shape is agreed; build the collection later when
 * granular per-question analytics are needed.
 */
export interface QuestionProgress {
  questionId: string
  examId: number
  answeredCount: number
  correctCount: number
  wrongCount: number
  lastResult: 'correct' | 'wrong'
  lastAnsweredAt: Timestamp
  needsReview: boolean
  bookmarked: boolean
}

// ── Entitlement (normalized, app-level — no Firestore types) ────────────────
//
// The runtime shape the app consumes, derived from users/{uid}.subscription by
// the repo's readEntitlement(). Plain JSON-friendly fields (no Timestamp) so it
// can live in React state and be compared without pulling in Firestore types.

export type EntitlementPlan = 'none' | 'full'
export type EntitlementStatus = 'none' | 'active' | 'expired' | 'canceled'

export interface Entitlement {
  active: boolean
  plan: EntitlementPlan
  status: EntitlementStatus
  /** ISO string when an expiry is known; omitted otherwise. */
  expiresAt?: string
  source?: 'manual' | 'gateway'
}

/**
 * Fail-CLOSED default: missing subscription, read failure, unauthed, or
 * Firestore unavailable. Entitlement is NEVER unlocked on error.
 */
export const NO_ENTITLEMENT: Entitlement = { active: false, plan: 'none', status: 'none' }

// ── Path helpers (string builders only — no Firestore calls) ────────────────

export const userPath          = (uid: string)                 => `users/${uid}`
export const summaryPath       = (uid: string)                 => `users/${uid}/summary/main`
export const examProgressPath  = (uid: string, examId: number) => `users/${uid}/examProgress/${examId}`
export const examAttemptsPath  = (uid: string)                 => `users/${uid}/examAttempts`
export const bookmarksPath     = (uid: string)                 => `users/${uid}/bookmarks/main`
