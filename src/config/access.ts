// S4B — frontend-only soft subscription gate (reversible).
//
// The gate is OFF unless the build explicitly sets VITE_PAYWALL_ENABLED=1, so the
// default/GitHub Pages build is completely unaffected. The cPanel production build
// opts in. This is a monetization/UX layer only — exam content still ships in the
// bundle — so keep it simple; there is no server enforcement here.

/** True only when the build opts in via VITE_PAYWALL_ENABLED=1. */
export const PAYWALL_ENABLED = import.meta.env.VITE_PAYWALL_ENABLED === '1'

/** Exams that are always free: Exam 1 (official taster) + Exam 18 (supplementary review). */
export const FREE_EXAM_IDS = new Set<number>([1, 18])

export function isExamFree(examId: number): boolean {
  return FREE_EXAM_IDS.has(examId)
}

/**
 * Whether the user may open the given exam. When the paywall is OFF, everything
 * is accessible. When ON, active subscribers get everything; everyone else gets
 * only the free exams. Superseded by canAccessOfficialExam below for both the
 * Exam and Practice flows; kept as the base gate used internally by isExamLocked.
 */
export function canAccessExam(isActiveSubscriber: boolean, examId: number): boolean {
  if (!PAYWALL_ENABLED) return true
  return isActiveSubscriber || isExamFree(examId)
}

/** Whether a card should render a lock chip (paywall on, not accessible). */
export function isExamLocked(isActiveSubscriber: boolean, examId: number): boolean {
  return !canAccessExam(isActiveSubscriber, examId)
}

/** Official exams 2-5 unlock for any authenticated user, even without an active
 *  subscription (a signed-in preview tier). Exam 1 is already universally free
 *  via FREE_EXAM_IDS; Exam 18 (supplementary) is untouched and never part of
 *  this set. */
export const AUTHED_PREVIEW_EXAM_IDS = new Set<number>([2, 3, 4, 5])

/**
 * Official-exam gate — shared by both the آزمون (Exam) and تمرین (Practice)
 * tabs, so the two flows always agree on access. When the paywall is OFF,
 * everything is accessible — same as canAccessExam. When ON: active
 * subscribers get everything; any authenticated user gets Exams 1-5;
 * everyone else (guests) gets only the universally-free exams (1, 18).
 */
export function canAccessOfficialExam(isAuthed: boolean, isActiveSubscriber: boolean, examId: number): boolean {
  if (!PAYWALL_ENABLED) return true
  if (isActiveSubscriber || isExamFree(examId)) return true
  return isAuthed && AUTHED_PREVIEW_EXAM_IDS.has(examId)
}
