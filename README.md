<div align="center">

<img src="docs/assets/icon-animated.svg" width="144" height="144" alt="Room to Speak icon: a kettle lit inside a terracotta ring">

# Room to Speak

**One photo of his room becomes a voice he can tap.**

**[Try it live → roomspeak.edycu.dev](https://roomspeak.edycu.dev)**

<img src="docs/assets/readme-hero-animated.svg" width="100%" alt="On a tablet, a living room photo dims while the kettle stays lit inside its terracotta ring and says “Aku mau kopi.”">

![React](https://img.shields.io/badge/React-19-2F2B28?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-2F2B28?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-2F2B28?logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-vision-B5532C)
![Web Speech API](https://img.shields.io/badge/Web%20Speech%20API-on--device-B5532C)
![License: MIT](https://img.shields.io/badge/License-MIT-6F665F)

</div>

## 🎬 See it in action

<div align="center">
  <img src="docs/assets/demo.gif" width="100%" alt="Room to Speak in use: an example bedroom is picked, rings appear on the walker, medicine, radio and other objects, Selesai switches to Speak mode, and tapping the walker lights it up while the phone speaks “Aku mau jalan sebentar”; then the Toilet core word.">
</div>

> **Example room → rings on what he'd talk about → one tap speaks.** Real AI output on an AI-generated example bedroom (detection answered by `deepseek-flash`; the wait is trimmed and the GIF has no sound — on a phone the device voice speaks each phrase).

## 💬 What it does

A proof of concept of a **visual scene display**: an AAC tool (augmentative and alternative communication) built from a photo of the user's own surroundings, for adults with **aphasia** after a stroke who understand everything but can't find the words.

1. **Setup (caregiver):** take one photo of the room he spends the day in — or tap one of four example rooms (AI-generated) to try it instantly. Gemini finds up to 8 objects he'd want to talk about and writes a short first-person phrase for each (kettle → “Aku mau kopi”). Rings appear on the photo. The caregiver hears, edits, removes or adds spots.
2. **Speak (him):** the photo fills the screen. One tap on an object and the device speaks the phrase in his language; the rest of the room dims and the object stays lit inside its ring. A row of core words (Ya / Tidak / Tolong / Sakit / Toilet) is always there.
3. The scene is saved on the device. Next time, the app opens straight into Speak mode.

<img src="docs/assets/devpost-gallery.png" width="100%" alt="Three steps: one photo of his room, rings on what he'd talk about, one tap and it speaks for him.">

## 🧭 How it works

```
Setup (once)                                   Speak (every day, on-device, offline)
photo ─► shrink to ≤1600px ─► POST /api/detect ─► Gemini (structured JSON: label, phrase, box_2d)
                                    │
                                    └─► validate ─► box → ring (center, radius) ─► nudge overlaps apart
tap ─► ring under the finger (on release) ─► speechSynthesis (id-ID) ─► ring pulses while speaking
```

- **`api/detect.ts`** — the only server code. Keeps API keys off the device, asks for structured JSON, validates every item, and walks a fallback ladder within a 55 s budget when a model is busy or slow. A provider without a key is skipped:

  | Order | Model | Measured on 6 test rooms |
  |---|---|---|
  | 1 | `gemini-3.8-flash` | tightest boxes, ~4–12 s |
  | 2 | `gemini-3.1-flash-lite` | accurate boxes, ~3–10 s, picks slightly more trivial objects |
  | 3 | `deepseek-flash` (DeepSeek API, V4.1 Flash, low effort) | good, slightly looser boxes, ~6–10 s |

  Also benchmarked and left out: OpenAI `gpt-5.4-mini` (fast, but loose boxes), Qwen 3.8 Flash (accurate, ~35 s), and free OpenRouter vision models (rate-limited or timed out on most calls).
- **`src/components/PhotoStage.tsx`** — the photo at its own aspect ratio with rings as real, labelled buttons. A tap counts on release inside the same ring it started in; a second finger cancels it (resting palms don't speak).
- **`src/speech.ts`** — device voice, interrupt-then-speak, large-text fallback when no matching voice exists.
- **`src/scene.ts`** — one scene in `localStorage`; nothing is stored on a server.

A one-page code guide lives in [`devpost/app-map.html`](devpost/app-map.html).

## 🚀 Try it locally

Requires Node 22+ and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
npm install
GEMINI_API_KEY=your-key npm run dev        # or put it in .env.local (see .env.example)
# optional fallback: DEEPSEEK_API_KEY
# open http://localhost:5173 — add `-- --host` to try it on a phone on the same wifi
```

Use a phone or tablet with an Indonesian voice installed for speech in Bahasa Indonesia (Android Chrome and iOS Safari ship one). English is available at setup.

## ✅ Tests

```bash
npm test                                            # 17 unit tests: validation, model-JSON parsing, box→ring, hit testing, ring separation, storage
node e2e/slice2-speak.mjs path/to/room-photo.jpg    # browser checks (dev server running); also slice1–4
```

The four `e2e/` scripts drive the real app in Chromium (34 checks across Speak mode, editing, persistence and failure states); `slice1-detect.mjs` calls the real Gemini API.

## 🛠️ How it was built

Planned and built with the [Devpost Learn skill pack](https://github.com/challengepost/learn-ai-basics) — the planning documents are in [`devpost/`](devpost/): [`scope.md`](devpost/scope.md) → [`prd.md`](devpost/prd.md) → [`spec.md`](devpost/spec.md) → [`checklist.md`](devpost/checklist.md) (build slices, verification, and every plan revision the build forced).

## ⚠️ Limits of this proof of concept

- A communication-aid prototype, **not** a medical device or therapy; no clinical claims.
- One room, one device, device voice only. A recorded family voice, more scenes and sharing between family members are out of scope.
- Detection quality depends on the photo; the caregiver can always remove, rename or add spots by hand.
- The room photo in the images above is AI-generated for illustration.

## 📄 License

[MIT](LICENSE)
