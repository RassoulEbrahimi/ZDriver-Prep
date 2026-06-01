// Phase 4C — Adapter from the authoring model to the runtime shape.
//
// Maps a `SourceQuestion` onto the existing `SourceExamQuestion` consumed by the
// Phase 4B screens, so adding real data never requires touching screen code.

import type { SourceExamQuestion } from '../../types'
import type { SourceQuestion } from './types'

/**
 * Eagerly-globbed source-exam images. No real images exist in Phase 4C, so this
 * map is empty for now; once assets land under src/assets/source-exams/exam-NN/,
 * they are hashed/bundled by Vite and resolvable here with no code change.
 */
const IMAGE_MODULES = import.meta.glob<string>(
  '../../assets/source-exams/**/*.{webp,png,jpg,jpeg}',
  { eager: true, import: 'default' },
)

/** Lookup keyed by path relative to the source-exams images root, e.g. 'exam-01/q03.webp'. */
const IMAGE_BY_RELATIVE_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(IMAGE_MODULES).map(([key, url]) => {
    const marker = 'source-exams/'
    const i = key.indexOf(marker)
    const rel = i >= 0 ? key.slice(i + marker.length) : key
    return [rel, url]
  }),
)

/**
 * Resolve an authored image `path` (e.g. 'exam-01/q03.webp') to a bundled asset URL.
 * Returns undefined when the asset is not present (e.g. all of Phase 4C).
 */
export function resolveImage(path: string): string | undefined {
  return IMAGE_BY_RELATIVE_PATH[path]
}

/** Map one authored question to the runtime `SourceExamQuestion` shape. */
export function toSourceExamQuestion(q: SourceQuestion): SourceExamQuestion {
  return {
    id: q.id,
    cat: q.category,
    text: q.text,
    options: q.options,
    answer: q.correctAnswerIndex,
    explanation: q.explanation ?? '',
    image: q.image ? resolveImage(q.image.path) : undefined,
    source: q.source,
    // Image-dependent if a real image exists OR it is declared pending.
    hasImage: Boolean(q.image) || Boolean(q.imagePending),
  }
}
