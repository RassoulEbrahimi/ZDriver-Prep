// Phase 4C — Real source-exam authoring data model.
//
// This is the AUTHORING shape for the official source exams (آزمون‌های آیین‌نامه)
// extracted from aeinname_asli.pdf. It is intentionally richer/stricter than the
// runtime `Question`/`SourceExamQuestion` shapes; `adapter.ts` maps it onto the
// existing runtime type so no screen or generic-exam code has to change.
//
// No real data, no PDF, and no images are added in Phase 4C — only the model.

/** Category ids — must match CATEGORY_META in src/data.ts. */
export type SourceCategoryId = 'signs' | 'rules' | 'safety' | 'vehicle' | 'firstaid'

/** All valid category ids, for runtime validation. */
export const SOURCE_CATEGORY_IDS: readonly SourceCategoryId[] = [
  'signs', 'rules', 'safety', 'vehicle', 'firstaid',
] as const

/** Metadata for an image-dependent question's illustration. */
export interface SourceImageMeta {
  /** Path relative to the images root, e.g. 'exam-01/q03.webp'.
   *  Final asset strategy: src/assets/source-exams/exam-NN/qMM.webp */
  path: string
  /** Persian alt text (required when an image is present) for RTL accessibility. */
  alt: string
  width?: number
  height?: number
}

/** One authored source-exam question. */
export interface SourceQuestion {
  /** Globally unique id, e.g. 'se-01-03' (kept disjoint from generic 'ir-' ids). */
  id: string
  /** Owning exam number, 1..17. */
  examNo: number
  /** Position within the exam, 1..30. */
  order: number
  /** Question text (Persian). */
  text: string
  /** Exactly four options. */
  options: [string, string, string, string]
  /** Zero-based index of the correct option. */
  correctAnswerIndex: 0 | 1 | 2 | 3
  category: SourceCategoryId
  /** Optional explanation shown after answering / in review. */
  explanation?: string
  /** Required provenance, e.g. 'aeinname_asli.pdf exam 1 q1'. */
  source: string
  /** Present only for image-dependent questions whose asset already exists. */
  image?: SourceImageMeta
  /** Declared image-dependent, but the asset has not been added yet (4C/4D staging).
   *  Surfaces the image placeholder in the UI; treated as a warning by validation. */
  imagePending?: boolean
}

/** One complete source exam (exactly 30 questions when populated). */
export interface SourceExamData {
  /** Exam number, 1..17. */
  examNo: number
  /** Optional display title; defaults to `آزمون N` in the UI. */
  title?: string
  questions: SourceQuestion[]
}
