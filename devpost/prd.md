---
doc: prd
status: approved
---

# Room to Speak — Product Requirements

A caregiver takes one photo of the room where a parent with aphasia spends the day. The objects he'd want to talk about become tap targets that speak a short first-person phrase for him.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. **First open.** No scene exists yet. The caregiver sees a short welcome line, a language choice (Bahasa Indonesia / English), and one button: "Ambil / pilih foto ruangan" ("Take / choose a room photo").
2. **Photo.** The caregiver takes or uploads one photo of his room. A short note says the photo is sent once to an AI service to find objects, and is otherwise kept only on this device.
3. **Finding spots.** The photo appears with a calm "Mencari benda…" ("Looking for objects…") indicator. Soft rings then appear one by one on up to 8 objects, each with a first-person phrase.
4. **Review.** Under the photo is a list: object name, phrase, edit, remove. The caregiver removes wrong spots, edits phrases, and can add a spot the AI missed by tapping the photo and typing a phrase.
5. **Done.** The caregiver taps "Selesai" ("Done"), and the scene is saved on the device. The app switches to Speak mode.
6. **Speak (him, every day).** The photo fills the screen with soft rings on the objects and the core row along the bottom. He taps the kettle; the ring pulses and the device voice says "Saya mau kopi."
7. **Coming back.** The next time the app opens, it goes straight to Speak mode with the saved scene. Success is being understood with one touch, in his own room.

## Screens and Layout

Two surfaces, plus the first-open state of Setup.

- **Setup (caregiver).** Top: language choice and photo button (first open), or the photo with rings (after detection). Below the photo: the spot list with edit and remove on each row, and "Tambah titik" ("Add spot"). Bottom: "Selesai" ("Done").
- **Speak (him).** Full-screen photo with rings. Core row fixed at the bottom. A small corner button opens Setup only after a 2-second press-and-hold, so a stray tap never leaves Speak mode. Speak mode shows no other text, menus or timeouts.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.

- Calm, warm and dignified. Off-white and soft charcoal, with one warm accent (terracotta) for the rings.
- Large, rounded, friendly typeface.
- Speak mode has no text except the core row labels. Rings are big and high-contrast, and the tap targets are generous.
- Setup is plain and practical, a tool for the caregiver.
- Avoid: clinical or hospital look, clip-art, busy UI, anything that times out.

## Features and Behavior

### Scene setup
- As a caregiver, I want the app to find the objects in his room that matter, so that I don't have to outline each one by hand.
  - [ ] After a photo is chosen, one AI request returns up to 8 spots. Each has an object name, a first-person phrase in the chosen language (≤ 6 words), and a position on the photo.
  - [ ] Rings appear on the photo one after another, each centered on its object.
  - [ ] Trivial things (walls, floor, ceiling, outlets, cables, generic clutter) are not suggested.
- As a caregiver, I want to correct the AI, so that every spot is right for him.
  - [ ] Remove takes one tap, and the ring disappears from the photo.
  - [ ] Editing a phrase updates what that spot will speak.
  - [ ] "Tambah titik": tap a point on the photo, type a phrase, and a new ring appears there.
  - [ ] A scene holds at most 12 spots (AI and manual combined).
- As a caregiver, I want to hear a spot before saving, so that I know how it sounds.
  - [ ] Tapping a ring in Setup speaks its phrase.

### Speaking
- As him, I want to tap an object in my room and have it speak for me, so that I'm understood without searching for words.
  - [ ] One tap on a ring speaks its phrase immediately, with no confirmation step.
  - [ ] The tapped ring visibly pulses while it speaks.
  - [ ] A new tap interrupts the current phrase and speaks the new one.
  - [ ] A tap on the photo outside any ring does nothing.
  - [ ] When rings overlap, the tap goes to the ring whose center is nearest.

### Core row
- As him, I want basic words always available, so that I can still communicate even if the photo has nothing useful.
  - [ ] The core row is always visible in Speak mode: Ya / Tidak / Tolong / Sakit / Toilet (English: Yes / No / Help / Pain / Toilet).
  - [ ] Each core word speaks on one tap, like a ring.
  - [ ] The core row is present even when the scene has zero spots.

### Language
- [ ] The language chosen at setup sets the language of the AI phrases, the core row and the voice.
- [ ] If the device has no voice for the chosen language, Setup tells the caregiver once, and Speak mode shows the phrase in large text when a spot is tapped.

## States and Boundaries

- **First use:** no saved scene, so Setup opens on the language choice and photo button.
- **Looking for objects:** the photo is visible with a calm progress indicator. No blank screen.
- **AI finds nothing / weak photo:** Setup says no clear objects were found and suggests a brighter photo from a different angle. The caregiver can retake, or add spots manually.
- **AI request fails (offline or error):** a plain message with "Coba lagi" ("Try again"). Manual "Add spot" still works, so setup never dead-ends.
- **Normal use:** the app opens straight into Speak mode with the saved scene.
- **Persistence:** one scene (photo, spots, phrases, language) stays on this device after closing and reopening. Nothing is stored on a server.
- **Replace photo:** choosing a new photo in Setup asks for confirmation, then replaces the whole scene.
- **Leaving Speak mode:** only via the 2-second hold on the corner button.

## Product Decisions

- **Setup flow:** list under the photo with edit, remove and add; Done switches to Speak. *(Agent recommendation, accepted by the learner: "do it".)*
- **Speak mode:** full-screen photo, always-on core row, instant speech with a ring pulse, press-and-hold exit. *(Agent recommendation, accepted.)*
- **Look:** calm, warm, off-white and charcoal with a terracotta accent, large rounded type. *(Agent recommendation, accepted.)*
- **Demo language:** Indonesian voice, English captions in the video. *(Agent recommendation, accepted.)*
- **Edge cases** (nothing found, request failure, missing voice, overlap, 12-spot cap): *agent recommendations, accepted under the learner's instruction to proceed on recommendations.*

## What We're Building

- One room photo → one AI request → up to 8 spots with object, phrase and position.
- Setup review: hear, edit, remove, add spot; Done.
- Speak mode: full-screen photo, tappable rings, instant device voice, always-on core row, press-and-hold exit.
- Language choice: Indonesian or English.
- One saved scene on the device that survives reopening.
- The states above: first use, loading, nothing found, request failure, missing voice.

## Deferred From the POC

- **Several rooms or scenes:** the kernel is proven with one room.
- **Recorded family voice:** needs recording and storage flows; the device voice proves the loop.
- **Accounts, sync, sharing between family members:** not needed on one device.
- **Usage history / "most used" phrases:** needs tracking over time; not visible in a short demo.

## Possible Later Enhancements

- Installable tablet app for the bedside.
- Phrase variations per object (e.g. kettle → coffee / tea / hot water).
- A therapist mode to export or print a scene.

## Non-Goals

- **Medical or clinical claims:** this is a communication aid prototype, not therapy.
- **Speech recognition:** he can't produce the words; the app speaks *for* him.
- **Showing a real patient on camera:** only with explicit consent; the demo uses the builder's own room.
- **Generic symbol boards:** the point is his real room, not clip-art cards.

## Open Questions

- **Detection quality on real Indonesian rooms:** the spike (5–10 real photos) runs as the first build step. If it falls short of about 5 useful spots per photo, Add spot becomes the primary path. *Can wait for `4-spec`, must be answered before the build.*
- **"Why This Matters" sentence** (`scope.md`): the learner's own words, needed for the submission story. *Can wait.*
