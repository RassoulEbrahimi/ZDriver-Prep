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

## Capture mode (`?capture=1`) — for screenshots

Adding `&capture=1` switches the viewer to a clean, full-bleed **9:16 canvas**:
no toolbar, no phone bezel, dark/brand theme pinned, RTL/Persian intact, and a
stable `data-capture-root` hook. It still renders the real `QuestionCard`. The
card is scaled down to fit when needed so a frame is never clipped. Normal
(review) mode is unaffected.

Example: `/marketing/capture/index.html?id=se-13-06&state=revealed&capture=1`

## Screenshot automation (Playwright)

`marketing/capture/shoot.mjs` drives capture mode to produce **1080×1920** PNGs
via viewport `360×640 @ deviceScaleFactor 3`. It starts a Vite dev server on port
`5173` (`--strictPort`) unless `CAPTURE_BASE_URL` is set, waits for fonts + images
+ layout, disables animations, screenshots the full viewport, and writes to the
paths already recorded in `manifest.json`
(`marketing/social-batch-01/screenshots/<question_id>_<state>.png`).

### One-time browser install

```bash
npx playwright install chromium
```

### Pilot (this step — M6A-3a)

Generates **only 4 pilot screenshots** for visual sign-off before the full batch:

```bash
npm run capture:batch-01 -- --ids se-13-06,se-03-13
```

Produces: `se-13-06_{unanswered,revealed}.png` and `se-03-13_{unanswered,revealed}.png`.

### Full batch — NOT for this step yet

> ⚠️ Deferred to M6A-3b. Do **not** run this during M6A-3a.

```bash
npm run capture:batch-01        # all 30 questions × 2 states = 60 PNGs
```

**M6A-3a delivers the tooling plus the 4 pilot screenshots only.** The full
60-image generation is a separate, later step.

## Guardrails

- Files live **only** under `marketing/capture/` (plus the generated PNGs under
  `marketing/social-batch-01/screenshots/`).
- Capture mode is a query-param branch **inside the marketing viewer only** —
  nothing under `src/` changes.
- **Not** imported by `src/main.tsx`, `src/App.tsx`, `TabBar`, or any production
  navigation.
- **Not** a `vite build` input → never emitted to `dist/` or the production bundle.
- `playwright` is a **devDependency**; `capture:batch-01` is manual/CI-only and is
  never wired into `build`/`prebuild`.
- No changes to `vite.config.ts`, auth, backend, paywall, or entitlement logic.
