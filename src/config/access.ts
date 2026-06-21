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
 * only the free exams.
 */
export function canAccessExam(isActiveSubscriber: boolean, examId: number): boolean {
  if (!PAYWALL_ENABLED) return true
  return isActiveSubscriber || isExamFree(examId)
}

/** Whether a card should render a lock chip (paywall on, not accessible). */
export function isExamLocked(isActiveSubscriber: boolean, examId: number): boolean {
  return !canAccessExam(isActiveSubscriber, examId)
}
