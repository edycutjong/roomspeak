# DEMO: a real run, with receipts

Room to Speak's judged capability is one call. A room photo goes to the serverless function [`api/detect.ts`](api/detect.ts), a vision model finds up to 8 things he'd want to talk about, and the app turns them into rings that speak. This file records that call running **live, in production, with nothing mocked**.

## The run

- **When:** 2026-10-04, 13:03:16 to 13:03:43 UTC. One call per room, one after another.
- **Where:** `POST https://roomspeak.edycu.dev/api/detect`, the production Vercel function. Requests entered Vercel's edge in Singapore (`sin1`) and the function ran in US East (`iad1`); see `vercel_id` in the JSON.
- **What was sent:** six AI-generated photos of Indonesian rooms (1536×1024), each shrunk and re-encoded in Chromium exactly as [`src/image.ts`](src/image.ts) does in the app (≤1600 px, JPEG quality 0.85), with `lang: "id"`.
- **Command:** `node scripts/receipt.mjs room-01.png … room-06.png --json public/judge/receipt-2026-10-04.json` ([`scripts/receipt.mjs`](scripts/receipt.mjs))
- **Raw responses:** [`public/judge/receipt-2026-10-04.json`](public/judge/receipt-2026-10-04.json): every spot, phrase and box, per room. The app serves the same file beside the judge page, at `/judge/receipt-2026-10-04.json`.

| Room (AI-generated) | In the repo as | Payload | HTTP | Answered by | Ladder step | Spots | Wall clock |
|---|---|---|---|---|---|---|---|
| room-01 · living room | `public/samples/living.jpg` | 330 KB | 200 | `gemini-3.8-flash` | 1 | 8 | 7.38 s |
| room-02 · stroke-recovery bedroom | `public/samples/bedroom.jpg` | 351 KB | 200 | `gemini-3.1-flash-lite` | 2 | 7 | 3.49 s |
| room-03 · dining area | `public/samples/dining.jpg` | 342 KB | 200 | `gemini-3.1-flash-lite` | 2 | 7 | 4.28 s |
| room-04 · cluttered family room at night | not in the repo | 320 KB | 200 | `gemini-3.1-flash-lite` | 2 | 7 | 3.38 s |
| room-05 · terrace | not in the repo | 420 KB | 200 | `gemini-3.1-flash-lite` | 2 | 8 | 4.07 s |
| room-06 · backlit kitchen | `public/samples/kitchen.jpg` | 256 KB | 200 | `gemini-3.1-flash-lite` | 2 | 6 | 3.99 s |

**6 / 6 rooms answered · 43 spots · p50 4.03 s · max 7.38 s · provider cost $0.00**

Wall clock is measured by the caller and covers everything a caregiver waits for: the upload, Vercel's routing, every ladder step tried, and the answer.

<details>
<summary><b>All 43 spots, as the app would speak them</b></summary>

| Room | Object → phrase (Bahasa Indonesia) |
|---|---|
| room-01 | Gelas teh → Mau minum tehnya · Kipas angin → Tolong nyalain kipas anginnya · TV → Tolong ganti siaran TV dong · Dispenser air → Minta tolong ambilkan air minum · Kursi sofa → Mau istirahat di kursi ini · Koran → Tolong ambilkan koran itu · Foto keluarga → Kangen sama anak dan cucu · Jam dinding → Sekarang jam berapa ya? |
| room-02 | tempat tidur → Saya mau istirahat sebentar. · kursi → Boleh bantu saya duduk di sini? · obat → Sudah waktunya saya minum obat. · gelas → Boleh minta tolong ambilkan minum? · radio → Tolong nyalakan radio itu. · jendela → Tolong buka jendelanya, gerah. · termos → Tolong tuangkan air hangat. |
| room-03 | teko listrik → Saya mau bikin kopi atau teh. · penanak nasi → Saya lapar, mau makan nasi. · tudung saji → Apa ada makanan di bawah sini? · toples kerupuk → Saya mau makan kerupuk. · kursi → Saya mau duduk istirahat sebentar. · jendela → Tolong buka jendelanya, udara segar. · kalender → Hari ini tanggal berapa ya? |
| room-04 | televisi → Tolong nyalakan TV-nya · kipas angin → Tolong nyalakan kipasnya · obat → Saya mau minum obat · gelas → Saya mau minum air · kasur → Saya mau istirahat dulu · ponsel → Tolong ambilkan HP saya · lampu meja → Tolong nyalakan lampunya |
| room-05 | kursi → Saya mau duduk santai · cangkir kopi → Saya mau minum kopi · koran → Saya mau baca koran · sandal → Saya mau pakai sandal · sapu → Tolong sapu terasnya · sangkar burung → Burungnya mau makan · pintu → Tolong bukakan pintunya · sepeda motor → Saya mau pergi keluar |
| room-06 | teko → Saya mau minum teh hangat · kulkas → Saya mau ambil minum dingin · jendela → Buka jendela, mau udara segar · penanak nasi → Saya mau makan nasi · tabung gas → Tolong nyalakan kompornya · ember → Tolong ambilkan air |

</details>

## Which ladder step answered

`api/detect.ts` tries three models in order within a 55 s budget and skips any provider without a key.

| Step | Model | Answered in this run |
|---|---|---|
| 1 | `gemini-3.8-flash` | 1 of 6 |
| 2 | `gemini-3.1-flash-lite` | 5 of 6 |
| 3 | `deepseek-flash` (DeepSeek's own API, low reasoning effort) | 0 of 6 |

Step 1 declined five of the six calls. Those five still finished in 3.38 to 4.28 s end to end, so step 1 failed fast and step 2 answered. That is the ladder doing its job on the free tier. The function reports which step answered (`model`), not why an earlier step was skipped.

## Cost

- **Gemini:** $0.00. The project uses the Gemini API free tier.
- **DeepSeek:** $0.00 in this run; step 3 never ran.
- **If step 3 answers (estimate):** about **$0.0010 per photo off-peak, $0.0020 at peak**. Basis: one direct call to `deepseek-flash` with the function's exact prompt and settings on the living-room photo used 1,314 input tokens (128 of them cached) and 1,374 output tokens (996 of them reasoning). That is priced at DeepSeek's published `deepseek-flash` rates, checked 2026-10-04: input $0.15 / $0.30 per 1M tokens (off-peak / peak, cache miss), $0.003 / $0.006 cached, output $0.60 / $1.20 per 1M ([pricing](https://api-docs.deepseek.com/quick_start/pricing)). It is an estimate, not a bill.

## Reproduce it

Against the live function, with no key. Chromium does the same JPEG encoding as the app:

```bash
npm ci && npx playwright install chromium
npm run receipt                                                      # the four example rooms in public/samples/
node scripts/receipt.mjs path/to/room.jpg --lang en --json out.json  # your own photos
```

Four of the six rooms ship in the repo as the app's example rooms (the same images, as JPEG). The other two, room-04 and room-05, were made for the detection spike and are not in the repo.

One call with nothing but `curl`: the example bedroom, English phrases.

```bash
{ printf '{"lang":"en","image":"'; curl -s https://roomspeak.edycu.dev/samples/bedroom.jpg | base64 | tr -d '\n'; printf '"}'; } \
  | curl -s https://roomspeak.edycu.dev/api/detect -H 'Content-Type: application/json' --data-binary @- -w '\n%{time_total} s\n'
```

On 2026-10-04 that returned 8 spots (bed, walker, radio, water glass, medicine, window, prayer rug, thermos) from `gemini-3.1-flash-lite` in 6.9 s.

## What this is not

- **Not the test suite.** CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the unit, regression and property tests and the Playwright specs with `/api/detect` and the device voice stubbed, so they need no key. The numbers above come from the real function.
- **Not a real-room benchmark.** All six photos are AI-generated (gpt-image, made for the detection spike). Real family photos are the next measurement.
