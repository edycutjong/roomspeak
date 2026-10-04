---
doc: spec
status: approved
---

# Room to Speak — Technical Spec

## How This Works, In Plain Language
Room to Speak is a web page that runs in the browser of a phone or tablet. It has three pieces:

1. **The app in the browser.** It shows the two screens (Setup and Speak), keeps the one saved scene on the device, and speaks phrases with the device's built-in voice. No account and no database.
2. **A tiny helper on a server ("detect").** The browser sends it the room photo once. The helper asks Google's Gemini AI to find up to 8 objects worth talking about and write a phrase for each, then sends the answer back. The helper exists only so the secret AI key never sits in the browser where anyone could copy it.
3. **Gemini (Google's AI).** It looks at the photo and returns, for each object, a name, a first-person phrase, and a box marking where the object is in the photo.

Why this shape: the only thing that needs the internet is finding the objects, once, during setup. Everything he does every day (tap, hear) works on the device itself, instantly and offline. That matches the kernel: the AI does the therapist's hand work once, then gets out of the way.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. Caregiver opens the page → the app checks device storage → no scene → **Setup** shows the language choice and photo button.
2. Caregiver picks or takes a photo → the app shrinks it to at most 1600 px (smaller upload, fits in storage) → shows it with "Mencari benda…".
3. The app sends the shrunk photo and language to **detect** → detect calls Gemini with the photo, the instructions and a strict answer format → Gemini returns up to 8 `{label, phrase, box_2d}` items.
4. detect checks the answer (drops malformed items, keeps at most 8) and returns it → the app turns each box into a **ring** (center point and size) → rings appear one by one (staggered animation).
5. Caregiver edits, removes or adds spots in the list → each change updates the in-memory scene → **Selesai** writes the scene to device storage → switch to **Speak**.
6. In Speak, he taps → the app finds the ring whose center is nearest the tap (within its radius) → stops any current speech → the device voice speaks the phrase → the ring pulses until speech ends.
7. Next open → the app finds the saved scene → goes straight to **Speak**.

## Stack
Agent recommendation, accepted by the learner ("do as your recommendation").

- **Vite 8 + React 19 + TypeScript** for the app: fast to build, widely documented, and the learner works through coding agents daily. https://vite.dev · https://react.dev
- **Plain CSS** (one stylesheet with CSS variables). The design is small; a CSS framework would add weight and push toward generic looks.
- **@fontsource/nunito**, a rounded typeface bundled with the app, so it works offline. https://fontsource.org/fonts/nunito
- **Web Speech API (`speechSynthesis`)** for the voice: built into browsers, free, instant, offline. https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
- **localStorage** for the one saved scene. https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **detect as a Vercel serverless function** (`api/detect.ts`), using plain `fetch` to Gemini's REST API, with no SDK. https://vercel.com/docs/functions · https://ai.google.dev/gemini-api/docs/image-understanding
- **Vitest** for unit tests of the pure logic (box → ring, nearest-ring hit test, answer validation). https://vitest.dev
- **Model: `gemini-3.8-flash`.** In the smoke test it returned accurate boxes in about 4–9 s; `gemini-3.5-flash` took about 30 s, and `gemini-2.5-flash` is retired for new keys. *To verify early in the build:* the real-photo spike.

## Where It Runs and How Someone Tries It
- **Runtime:** a modern mobile or desktop browser (Chrome or Safari). Node 22 for development.
- **Key:** `GEMINI_API_KEY` as an environment variable, set in the shell that runs `npm run dev` (e.g. `GEMINI_API_KEY=... npm run dev`); on Vercel, in project settings. It is never written into the project folder.
- **Local run:** `npm install` then `npm run dev` → open `http://localhost:5173`. The Vite dev server also serves `/api/detect` with the same handler file, so no Vercel account is needed locally.
- **Tests:** `npm test`.
- **Demo recording:** a phone-sized browser window (or a real phone on the local network via `npm run dev -- --host`), Indonesian voice, with English captions added in editing.
- **Deployment (optional, recommended):** Vercel, so judges can try it on their own phone. Set `GEMINI_API_KEY` in the project, then deploy from the repo. Decided at `6-ship`; it never replaces the video or the public repo.

## Look and Feel
From `prd.md > Look and Feel`.
- **Colors (CSS variables):** background `#F7F3EE` (warm off-white), ink `#2F2B28` (soft charcoal), accent `#C8643B` (terracotta) for rings and the primary button, muted `#8A817A` for secondary text.
- **Type:** Nunito 600/800. Base 18 px in Setup; core-row labels 22–26 px.
- **Rings:** terracotta, 4–5 px stroke, translucent warm fill, white outer halo so they read on any photo. Minimum tap diameter 64 px. Pulse = gentle scale and glow while speaking.
- **Speak mode:** edge-to-edge photo on a charcoal backdrop. The core row has five equal, large rounded buttons. The only other control is a small, low-contrast corner button with a hold-progress ring.
- **Setup:** spacious, plain list rows, one terracotta primary action at a time. Copy is short, warm and practical, in the chosen language.
- **Motion:** rings fade and scale in about 120 ms apart; nothing flashes. The app respects `prefers-reduced-motion`.

## Components

### App shell and scene store
Decides which screen to show (no saved scene → Setup, otherwise Speak). Holds the current scene and saves and loads it from localStorage.
PRD ref: `prd.md > States and Boundaries` (first use, normal use, persistence).

### Setup screen
Language toggle, photo picker (`<input type="file" accept="image/*" capture="environment">`), photo resizing, the detect call, staggered ring reveal, spot list (hear / edit phrase / remove), add-spot mode (tap photo → type phrase), 12-spot cap, replace-photo confirmation, Done. It also shows the states: looking, nothing found, request failed, and the missing-voice notice.
PRD ref: `prd.md > Scene setup`, `prd.md > Language`, `prd.md > States and Boundaries`.

### Photo stage
Shared by both screens. It renders the photo inside a box that keeps the photo's own aspect ratio and fits the screen, so ring positions can be plain percentages of that box. Rings are drawn on top. One pointer handler on the stage turns a tap into "nearest ring within radius" (or a point, in add-spot mode).
PRD ref: `prd.md > Speaking` (overlap rule, tap outside does nothing), `prd.md > Scene setup` (add spot).

### Speak screen
Full-screen photo stage, core row, speech on tap with interrupt, pulse while speaking, large-text fallback when no voice exists, and a 2-second hold on the corner button to return to Setup.
PRD ref: `prd.md > Speaking`, `prd.md > Core row`, `prd.md > Screens and Layout`.

### Speech helper
Picks a device voice that matches the language (`id-ID` or `en-*`), with `cancel()` before every `speak()`. It reports whether a matching voice exists, and signals start and end so the UI can pulse. Voices load asynchronously, so it waits for `voiceschanged`.
PRD ref: `prd.md > Speaking`, `prd.md > Language`.

### detect function
`POST /api/detect` with `{image: base64 JPEG, lang: "id"|"en"}` → `{spots: [{label, phrase, box: [ymin,xmin,ymax,xmax]}]}`. It calls Gemini with the prompt proven in the spike and a JSON response schema. It validates the answer (4 numbers in 0–1000, min < max, non-empty phrase, ≤ 8 items), returns `502` with a plain message on failure, and rejects bodies over about 4 MB. The prompt lives in one module used by the handler.
PRD ref: `prd.md > Scene setup`.

## Data Model
One scene, kept in memory and in localStorage under key `roomspeak.scene.v1`:

```ts
type Lang = "id" | "en";
type Spot = {
  id: string;           // random
  label: string;        // object name, shown in Setup only
  phrase: string;       // what gets spoken
  x: number; y: number; // ring center, 0–1 fraction of photo width/height
  r: number;            // ring radius, fraction of photo width (clamped to min tap size at render)
  source: "ai" | "manual";
};
type Scene = { version: 1; lang: Lang; photo: string /* JPEG data URL, ≤1600px */; aspect: number; spots: Spot[] /* ≤12 */ };
```

- Created in Setup and written only when the caregiver taps **Selesai** (and after edits made from a re-entered Setup).
- Read on every app open. If it's missing or unreadable, the app goes to Setup.
- A shrunk photo is about 200–500 KB, well inside localStorage's ~5 MB. If saving fails (storage full or blocked), Setup shows a plain message and the scene stays in memory for the session.
- Core-row words are constants per language, not stored.

## File Structure

```
build/
├── api/
│   └── detect.ts            # Vercel function: POST photo → Gemini → validated spots
├── src/
│   ├── main.tsx             # React entry, font import
│   ├── App.tsx              # shell: picks Setup vs Speak from the scene store
│   ├── styles.css           # tokens + all styles
│   ├── scene.ts             # Scene/Spot types, load/save (localStorage), box→ring conversion
│   ├── geometry.ts          # nearestRing hit test, percentage math
│   ├── speech.ts            # voice selection, speak/cancel, start/end events
│   ├── image.ts             # resize to ≤1600px JPEG data URL
│   ├── copy.ts              # UI strings + core words per language
│   ├── detect-client.ts     # fetch /api/detect with timeout, error mapping
│   ├── components/
│   │   ├── PhotoStage.tsx   # photo + rings + single pointer handler
│   │   ├── SetupScreen.tsx  # language, photo, states, spot list, add spot, Done
│   │   ├── SpotList.tsx     # rows: hear / edit / remove
│   │   ├── SpeakScreen.tsx  # full-screen stage, core row, hold-to-exit
│   │   └── HoldButton.tsx   # 2-second press-and-hold with progress ring
├── shared/
│   ├── prompt.ts            # Gemini prompt + response schema (used by api/)
│   └── validate.ts          # answer validation (used by api/ and tests)
├── tests/                   # vitest: geometry, scene conversion, validate
├── e2e/                     # Playwright scripts that drive the real app per slice
├── index.html
├── vite.config.ts           # React plugin + dev middleware serving api/detect.ts
├── package.json
├── README.md                # judge-facing (written at 6-ship)
├── LICENSE                  # MIT
└── devpost/                 # Devpost learning workspace (scope, prd, spec, checklist)
```

## External Services and Dependencies

### Google Gemini API
- **Call:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`, header `x-goog-api-key: $GEMINI_API_KEY`.
- **Payload:** `contents[0].parts = [{inline_data: {mime_type: "image/jpeg", data}}, {text: prompt}]`; `generationConfig = {responseMimeType: "application/json", responseSchema, temperature: 0.2}`.
- **Response:** `candidates[0].content.parts[0].text` holds a JSON array of `{label, phrase, box_2d, confidence}`, where `box_2d = [ymin, xmin, ymax, xmax]` normalized to 0–1000.
- **Docs:** https://ai.google.dev/gemini-api/docs/image-understanding · https://ai.google.dev/gemini-api/docs/structured-output
- **Fallback provider (added during the build):** when both Gemini models fail or stall, detect calls DeepSeek's own API (`deepseek-flash`, V4.1 Flash with image input, `reasoning_effort: low`, `DEEPSEEK_API_KEY`) with the same prompt plus a JSON-object instruction (`JSON_OBJECT_SUFFIX`). Chosen from a box-accuracy and latency benchmark on the same rooms. Total budget 55 s; the browser waits 70 s; `vercel.json` sets `maxDuration: 70`.
- **Limits and cost:** one call per setup. Free-tier rate limits are far above demo needs. Gemini sometimes answers 503 "high demand", or stalls, so detect gives each model 12 s and falls back from `gemini-3.8-flash` to `gemini-3.1-flash-lite` (fast; boxes accurate, picks a little more trivial) to `gemini-3.6-flash`, all within a 50 s budget.

### Vercel (optional hosting)
Serverless function plus static hosting; free tier is enough. https://vercel.com/docs/functions

## Important Failure Modes

- **Gemini busy or offline (503, timeout after 25 s)** → Setup shows "Belum berhasil mencari benda" with **Coba lagi**. Add spot still works.
- **Weak detections on a real room** (wrong or trivial spots, or zero) → the caregiver removes or adds spots in a few taps. With zero results, Setup suggests a brighter photo or a different angle. The core row always works.
- **No Indonesian voice on the device** (some desktop browsers) → a one-time notice in Setup. Speak mode shows the phrase in large text on tap. For the demo, record on a device with an `id-ID` voice (Android Chrome or iOS Safari have one).

## What Was Simplified and Why

- **Rings from a box's center and size** instead of exact object outlines. Rings are easier to hit and calmer to look at. Outlines would need a segmentation model and add nothing to the tap.
- **localStorage, one scene** instead of a database and accounts. The POC proves one room on one device. More would need IndexedDB or a server, plus sign-in.
- **Device voice** instead of natural cloud voices or a recorded family voice. Instant and offline. A family voice is in `prd.md > Deferred From the POC`.
- **Dev middleware instead of the Vercel CLI locally.** One command to run, and the same handler file in both places.

## Decisions and Open Issues

- **Stack, server helper, storage, voice, model:** agent recommendations, accepted under the learner's standing instruction "do as your recommendation". Tradeoff accepted: a server helper is required for the key, so a pure static page isn't possible.
- **Learner uncertainty: none raised.** The learner asked to proceed on recommendations without questions. The genuine technical unknown is detection quality on real Indonesian rooms, so it is the agreed investigation: the spike (`roomspeak` project-level `specs/spike/detect.py`) on 5–10 real photos. Evidence needed: about 5 useful spots per photo on most photos. If it falls short, Add spot becomes the primary path in the demo.
- **Carried from `prd.md > Open Questions`:** the "Why This Matters" sentence (learner's own words) is needed before `6-ship`, not before the build.
- **Unverified until build:** `id-ID` voice availability on the recording device; the 1600 px photo size vs. detection accuracy (the smoke test used 1152–1280 px and was accurate).
