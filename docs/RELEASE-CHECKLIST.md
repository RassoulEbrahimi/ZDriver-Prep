# ZDriver Prep — Release Checklist

A practical, per-release QA pass before shipping to real users.

## How to use

- Copy this list for each release and check items against the live build:
  **https://ranandegiyar.info/**
- Record the deployed commit SHA: `__________`
- A release is "go" only when sections 1–8 pass. Review the Known blockers section before every wider release.

## 1. Production deploy verification

- [ ] Latest `main` is merged and the deploy run is green.
- [ ] Live site loads at the production domain (https://ranandegiyar.info/) on the expected commit SHA.
- [ ] `npm run build` is clean locally; no errors in the browser console on first load.
- [ ] Root-domain assets (`/assets/...`) resolve — no 404s in the Network tab.

## 2. PWA install / update QA

- [ ] Install prompt appears (Android/Chrome); "Add to Home Screen" works (iOS Safari).
- [ ] Installed app shows the correct short name (`ZDriver`) and Persian title.
- [ ] After a new deploy, the update toast appears and reloading applies the new version.

## 3. Guest-mode QA

- [ ] Home shows the neutral guest identity (`سلام،` / `مهمان` / person-icon avatar).
- [ ] Practice, exam, mistakes, and progress are all usable without an account.
- [ ] Progress persists across reloads (localStorage).

## 4. Logged-in mode QA

- [ ] Sign up / sign in / sign out / password reset all work via the auth sheet.
- [ ] Signed-in Home shows the user email and the email-initial avatar.
- [ ] Progress, mistakes, bookmarks, and exam attempts sync; local data is never lost (additive merge).

## 5. Firebase Auth/Firestore smoke

- [ ] With Firebase configured: auth works and one exam attempt round-trips to Firestore.
- [ ] With Firebase unreachable/unconfigured: app stays usable as a guest with no crash (fail-soft).

## 6. Offline / basic PWA behavior

- [ ] Second load works offline (service worker precache).
- [ ] Cloud features degrade quietly offline; local progress still saves.

## 7. RTL / mobile / dark-mode

- [ ] Layout is correct at mobile width (~375px); no overflow or clipping.
- [ ] RTL alignment is correct across Home, catalogs, question, and result screens.
- [ ] Light / dark / system themes all render correctly, persist, and show no flash on boot.

## 8. Source-exam content checks

- [ ] `npm run validate:source-exams -- --lint-explanations` passes (510/510, zero empty explanations).
- [ ] Spot-check a few exams: questions render and options, answers, and explanations display cleanly in Persian.

## 9. Known blockers before wider launch

- [ ] **Images for Exams 13–17 are not wired yet** (asset folders do not exist).
- [ ] **62 `imagePending`** remain across Exams 13–17.
- [ ] **OCR cleanup pending:** Exam 16 numeric/digit options; Exam 17 distractor options.
- [ ] Image-pending priority/geometry explanations to be visually verified after images are wired.
- [ ] Flagged review items: se-11-12, se-12-07, se-12-21, se-13-12, se-13-13, se-14-13 to se-14-16, se-15-08, se-15-13, se-15-15, se-16-06, se-16-15, se-16-27, se-17-26.

## Maintenance note

Keep this list short. When a recurring check becomes automated (CI or a test), remove it
from here and link the automation instead.
