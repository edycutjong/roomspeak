# For judges

**One photo of his room becomes his voice. Tap an object, and it speaks for him.**

A communication aid for adults with aphasia after a stroke: they understand everything but can't find the words. No login, no install. The same page ships with the app as [`public/judge/index.html`](public/judge/index.html), served at **[roomspeak.edycu.dev/judge](https://roomspeak.edycu.dev/judge/)**.

## The 30-second path

1. **Open [roomspeak.edycu.dev](https://roomspeak.edycu.dev) on a phone.** A laptop works too. It starts in Bahasa Indonesia; tap **English** at the top first for English phrases.
2. **Tap one of the four example rooms, or take a photo of a room.** In about 4 seconds, rings appear on up to 8 things he'd want to talk about, each with a short first-person phrase. The example rooms are AI-generated.
3. **Tap Selesai** (**Done** in English). The photo fills the screen.
4. **Tap an object.** The device speaks its phrase and the rest of the room dims. The bottom row (Ya, Tidak, Tolong, Sakit, Toilet) always speaks too.

To edit again, hold the gear button (top right) for 2 seconds. The scene is saved on the device, so the app reopens straight into this mode.

## Receipts

Six AI-generated rooms sent to the live production function on 2026-10-04 at 13:03 UTC, one call each, encoded exactly as the app sends them. Every response, with each spot's phrase and box, is in [`public/judge/receipt-2026-10-04.json`](public/judge/receipt-2026-10-04.json); how the run was made is in [DEMO.md](DEMO.md).

| Rooms answered | Spots found | Median wall clock | Slowest room | Provider cost |
|---|---|---|---|---|
| **6 / 6** | **43** | **4.03 s** | **7.38 s** | **$0.00** |

Per room. Step 1 is `gemini-3.8-flash`, step 2 `gemini-3.1-flash-lite`.

| Room (AI-generated) | Step | Spots | Time |
|---|---:|---:|---:|
| Living room | 1 | 8 | 7.38 s |
| Stroke-recovery bedroom | 2 | 7 | 3.49 s |
| Dining area | 2 | 7 | 4.28 s |
| Family room at night | 2 | 7 | 3.38 s |
| Terrace | 2 | 8 | 4.07 s |
| Backlit kitchen | 2 | 6 | 3.99 s |

- **The fallback ladder did real work.** `gemini-3.8-flash` answered 1 room. It declined the other 5, and `gemini-3.1-flash-lite` answered each of them in under 4.3 s. `deepseek-flash` was not needed.
- **Cost.** Gemini API free tier, so $0.00. If the DeepSeek step answers, one photo costs about $0.001 off-peak or $0.002 at peak. That is an estimate from DeepSeek's published price and one measured call (1,314 input and 1,374 output tokens).
- **Tests, all without an API key.** 25 Vitest tests, among them 3 regression tests each named for a defect the build hit, a property test over **100,000 generated model answers** (0 invalid spots kept), and 3 checks that no API key reaches the browser. Plus 2 Playwright specs in CI and 5 browser scripts. See [Tests & CI](README.md#-tests--ci).

## Reproduce it

No clone and no key. This sends the example bedroom to the live function and prints the spots, the model that answered, and the time:

```bash
{ printf '{"lang":"en","image":"'; curl -s https://roomspeak.edycu.dev/samples/bedroom.jpg | base64 | tr -d '\n'; printf '"}'; } \
  | curl -s https://roomspeak.edycu.dev/api/detect -H 'Content-Type: application/json' --data-binary @- -w '\n%{time_total} s\n'
```

The full receipt, from a clone of the repo:

```bash
npm ci && npx playwright install chromium
npm run receipt   # the four example rooms → the live function, one call each
```

CI runs the tests and browser specs with detection and the device voice stubbed. That is the test suite, not the product. Both commands above call the real function.

## Honest limitations

- **No private photos on the free tier.** Detection runs on the Gemini API free tier. [Google's terms](https://ai.google.dev/gemini-api/terms) for unpaid use let it use submitted images to improve its products and let human reviewers read them, and ask that no personal information be sent. Fine for the AI-generated example rooms; a family's real room needs the paid tier first, where Google does not use prompts or images that way.
- **Measured on AI-generated rooms only.** The six receipt rooms and the four examples are AI-generated. There is no benchmark on real family photos yet. The caregiver can always remove, rename or add spots by hand.
- **A proof of concept, not a medical device.** One room, one device, the device's own voice. Without an Indonesian voice installed, phrases show as large text instead of speech. No clinical claims.

## Links

- **Live app:** [roomspeak.edycu.dev](https://roomspeak.edycu.dev)
- **Story (landing page):** [roomspeak.edycu.dev/story](https://roomspeak.edycu.dev/story/)
- **Pitch deck:** [roomspeak.edycu.dev/deck](https://roomspeak.edycu.dev/deck/)
- **Code:** [github.com/edycutjong/roomspeak](https://github.com/edycutjong/roomspeak), MIT, planning docs in [`devpost/`](devpost/)
- **Release:** [v0.1.0](https://github.com/edycutjong/roomspeak/releases/tag/v0.1.0)
- **Demo video:** coming soon
