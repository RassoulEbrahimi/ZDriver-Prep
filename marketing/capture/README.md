# Capture Viewer — Social Batch 01 (dev only)

A **development-only** viewer for manual visual review of the 30 approved
batch-01 social questions. It renders the **real** app `QuestionCard` component in
both states so we can eyeball each frame before any screenshot automation.

> No Playwright. No screenshot generation. Not a production route. Not part of the
> production build.

## Run locally

```bash
npm run dev
```

Then open (default Vite port `5173`):

- Unanswered: <http://localhost:5173/marketing/capture/index.html?id=se-13-06&state=unanswered>
- Revealed:   <http://localhost:5173/marketing/capture/index.html?id=se-13-06&state=revealed>

Opening `/marketing/capture/index.html` with no params defaults to the first
manifest item in the `unanswered` state.

### Navigation
- **‹ قبلی / بعدی ›** — step through the 30 manifest items in order.
- **حالت** toggle — switch a question between `unanswered` and `revealed`.
- The URL stays in sync with the current id + state, so any frame is copy‑pasteable.

## Query params

| Param | Values | Meaning |
|-------|--------|---------|
| `id`    | any batch-01 `question_id` (e.g. `se-13-06`) | Which question to render |
| `state` | `unanswered` \| `revealed` | Frame state (default `unanswered`) |

Unknown / missing ids show a clear on-screen error listing a valid example id.

## How it works

- **Which questions:** `marketing/social-batch-01/manifest.json` provides the
  ordered list of 30 `question_id`s.
- **Question content:** resolved from `src/data/source-exams/` via
  `SOURCE_EXAMS_DATA` + `toSourceExamQuestion` (the existing adapter), which also
  resolves the Vite-bundled image URLs for sign questions.
- **State → props:** the two states are expressed purely through `QuestionCard`
  props:
  - `unanswered` → `submitted={false}`, `selected={null}`
  - `revealed` → `submitted={true}`, `selected={question.answer}`, `showExplanation`

## Guardrails

- Files live **only** under `marketing/capture/`.
- **Not** imported by `src/main.tsx`, `src/App.tsx`, `TabBar`, or any production
  navigation.
- **Not** a `vite build` input → never emitted to `dist/` or the production bundle.
- No changes to `vite.config.ts`, `package.json`, auth, backend, paywall, or
  entitlement logic.
