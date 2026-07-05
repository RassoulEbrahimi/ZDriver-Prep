# Audio-Mix Guide — Social Batch 01

Local, manual workflow for building per-question and per-video voiceover tracks
from ElevenLabs voice clips + local sound effects, using the system **ffmpeg**.

> All audio/video here is a **local artifact** and is **git-ignored** — never
> commit MP3/MP4. Only the script and this guide are tracked.

## Prerequisites

- **ffmpeg installed locally.** On Windows: `winget install Gyan.FFmpeg`.
  The script finds ffmpeg on `PATH`, via the `FFMPEG_PATH` env var, or in the
  winget install location automatically.

## ElevenLabs voice

- Voice: **Noushin - Cheeky, Smooth and Personable**.
- Read the `text_tts` column from `elevenlabs-scripts.csv` (Persian numbers are
  already spelled out there).
- Save each clip under **`marketing/social-batch-01/audio/`** with the exact
  suggested filename:
  - `<question_id>_question.mp3`
  - `<question_id>_explanation.mp3`

## Sound effects (local)

- `marketing/social-batch-01/audio-mix/tick_3s.mp3` — ticking clock SFX (duration measured at runtime).
- `marketing/social-batch-01/audio-mix/ding.mp3` — reveal "ding".

## Per-question mix order

```
question voice  →  tick_3s.mp3  →  ding.mp3  →  explanation voice
```

## Run (G01 pilot — M6B-3a)

```bash
node marketing/build-audio-mix.mjs --groups G01
```

Outputs under `marketing/social-batch-01/audio-mix/`:

- `G01_Q1_mix.mp3`, `G01_Q2_mix.mp3`, `G01_Q3_mix.mp3` (MP3, 44.1 kHz, 192 kbps, stereo)
- `G01_full_audio.mp3` (the three question mixes concatenated)
- `G01_timeline.csv` + `G01_timeline.md` — exact CapCut timing markers (when to
  show the unanswered vs revealed screenshot, where tick/ding land), computed from
  the **measured** audio durations.

With no `--groups`, the script defaults to **G01**. Later groups:
`node marketing/build-audio-mix.mjs --groups G02` (needs that group's voice clips).

## Promo-card gaps (G02+)

From G02 onward you can insert a short **silent gap after each explanation** for a
manually-placed promo/outro card (e.g. a Gemini promo card) between questions:

```bash
node marketing/build-audio-mix.mjs --groups G02 --promo-gap-seconds 3
```

- `--promo-gap-seconds N` appends **N seconds of silence** to each question's mix
  (synthesized with ffmpeg — no input file is created or changed). Default is `0`
  (no gap, the original G01 behavior).
- The timeline gains a **`promo`** segment after each `revealed` segment
  (so 5 segments per question instead of 4). Its `screenshot_file` is
  `manual-promo-card` — the actual promo image is **placed by hand in CapCut**
  during that gap. The instruction reads: *"Show the Gemini promotional outro card
  here and apply a subtle zoom if desired."*

## In CapCut

Import the group's **`<GROUP>_full_audio.mp3`** as the audio bed, then place the 6
screenshots (`screenshots/<id>_unanswered.png` / `_revealed.png`) against it using
the exact timestamps in `<GROUP>_timeline.csv` / `.md`. For groups built with a
promo gap, drop your promo-card image into each `promo` segment.

## Git

`marketing/social-batch-01/audio/`, `audio-mix/`, and `videos/` are all
git-ignored. Generated mixes stay local; do not commit them.
