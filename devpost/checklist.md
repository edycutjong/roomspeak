---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast (learner: "no question to me, do as your recommendation")

## Slices

- [x] **1. A room photo turns into rings on the right objects**
  Becomes usable: Open the app, choose a room photo, and soft rings appear one by one on up to 8 objects, each with a phrase listed under the photo.
  Why now: This is the kernel and the biggest risk (real detection through our own server helper). Everything else is ordinary UI around it.
  PRD ref: `prd.md > The Core Journey` (steps 1–3), `prd.md > Scene setup`
  Spec ref: `spec.md > detect function`, `spec.md > Photo stage`, `spec.md > Setup screen`, `spec.md > External Services and Dependencies`, `spec.md > File Structure`
  Build: Scaffold Vite + React + TS with the spec's file structure, styles and font. Add `shared/prompt.ts`, `shared/validate.ts`, `api/detect.ts`, and Vite dev middleware serving it. Add `image.ts` resize, `detect-client.ts`, `scene.ts` box→ring, `PhotoStage` with staggered rings, and a minimal Setup (language toggle, photo picker, looking state, read-only spot list).
  Verify (mechanical): `npm test` passes (validate + box→ring). `npm run build` succeeds. With the dev server running, POST a real room photo to `/api/detect` and get validated spots. Load the app in a headless browser, upload a photo, and see rings rendered (screenshot).
  Learner check: Run `npm run dev`, open http://localhost:5173, choose a photo of your room, and see whether the rings land on things he'd want to talk about.
  Commit: `Detect objects in a room photo and show rings`

- [x] **2. Tap a ring and the device speaks for him**
  Becomes usable: Tap Selesai and the photo goes full-screen. Tapping a ring speaks its phrase and the ring pulses. The core row speaks Ya / Tidak / Tolong / Sakit / Toilet. A 2-second hold on the corner button returns to Setup.
  Why now: Completes the core loop end to end (photo → spots → voice), so the early feedback is about the real experience.
  PRD ref: `prd.md > Speaking`, `prd.md > Core row`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > Speak screen`, `spec.md > Speech helper`, `spec.md > Photo stage`
  Build: `speech.ts` (voice pick, cancel-then-speak, start/end events). `geometry.ts` nearestRing. `SpeakScreen` with core row, pulse, large-text fallback, `HoldButton`. Setup → Speak switch.
  Verify (mechanical): Unit tests for nearestRing (inside, outside, overlap → nearest center). In a headless browser with speechSynthesis stubbed, a ring tap calls speak with the right phrase and lang, a second tap cancels first, a tap outside rings calls nothing, and a hold of under 2 s stays in Speak while 2 s or more returns to Setup.
  Learner check: Tap Selesai, tap the kettle (or any ring), and hear the phrase. Try the core row. Hold the corner button to go back.
  Commit: `Speak mode with tappable rings and core row`

- [x] **3. The caregiver can correct every spot**
  Becomes usable: In Setup, each spot can be heard, its phrase edited, or removed; "Tambah titik" adds a ring where the caregiver taps and asks for a phrase; at most 12 spots.
  Why now: Detection will be imperfect on real rooms; correction is what makes the scene trustworthy and is the fallback if the spike is weak.
  PRD ref: `prd.md > Scene setup`
  Spec ref: `spec.md > Setup screen`, `spec.md > Photo stage`, `spec.md > Data Model`
  Build: `SpotList` rows (hear / edit inline / remove), add-spot mode in `PhotoStage`, 12-spot cap, tapping a ring in Setup speaks it.
  Verify (mechanical): Headless browser: remove a spot → ring count drops; edit a phrase → speak receives the new text; add spot → new ring at tap point with typed phrase; add button disabled at 12.
  Learner check: Remove one wrong spot, rename one, add one the AI missed, then tap them in Speak mode.
  Commit: `Edit, remove and add spots in setup`

- [x] **4. The scene survives reopening, and every awkward state is handled**
  Becomes usable: Close and reopen and it goes straight to Speak with the saved scene. First open goes to Setup. Nothing found, request failure (Coba lagi), missing voice and replace-photo confirmation all show calm, plain messages.
  Why now: Persistence and failure states only make sense once the full loop exists; they turn the demo into something a family could actually leave on a tablet.
  PRD ref: `prd.md > States and Boundaries`, `prd.md > Language`
  Spec ref: `spec.md > App shell and scene store`, `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: localStorage load/save in `scene.ts`, App routing on load, save on Selesai, storage-failure message, empty/failed states with retry, missing-voice notice, replace confirmation, `prefers-reduced-motion`.
  Verify (mechanical): Unit test load/save round trip and corrupt-data fallback. Headless browser: save → reload → Speak mode with same spots; detect stubbed to fail → Coba lagi shown and Add spot still works; detect returns [] → nothing-found message.
  Learner check: Set up a scene, close the tab, reopen it. Then turn off wifi and try a new photo to see the retry message.
  Commit: `Persist the scene and handle empty, error and voice states`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — moved to the final session (learner asked to run without pauses); not yet done
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- Vite 8 / Vitest 5 instead of Vite 6 — the current @vitejs/plugin-react requires Vite 8; nothing else in the plan changes.
- Key passed as a shell environment variable instead of `.env.local` — the workspace rule keeps credentials out of the project tree entirely.
- detect falls back across models on overload — the first real call through the helper hit Gemini 503 "high demand"; with retry plus fallback, setup took 16–24 s in testing, so the calm "looking" state matters.
- Rings capped smaller (radius ≤ 8% of photo width) and numbered in Setup — the first screenshot showed oversized, overlapping rings on a phone-width photo.
- Added `e2e/` Playwright scripts as the per-slice mechanical verification of the running app.
- Rings reveal one by one only in Setup — in Speak mode the replayed animation left rings invisible for the first moments, which would hide targets from him.
- Early hands-on checkpoint folded into the final kick-the-tires session — the learner asked for no interruptions; the loop still needs their hands-on check before the build is called done.
- Language toggle locks once a photo is chosen (changing it means choosing a new photo) — the phrases come back in the chosen language, so switching afterwards would mix an English voice with Indonesian phrases.
- Storage failure is shown once in Setup and a second Selesai continues with the in-memory scene — Speak mode must stay text-free, so the warning cannot live there.
