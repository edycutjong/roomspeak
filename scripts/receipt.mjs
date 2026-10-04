// Real-run receipt: sends room photos to the LIVE detect function and records what answered, and how fast.
// Usage: node scripts/receipt.mjs [photo ...] [--url <endpoint>] [--lang id|en] [--json out.json]
// Defaults to the app's four example rooms (public/samples/) and https://roomspeak.edycu.dev/api/detect.
// Each photo is shrunk and re-encoded in Chromium exactly like src/image.ts (≤1600 px, JPEG 0.85),
// so the function receives the same bytes the app would send. Calls run one after another.
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const LADDER = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "deepseek-flash"]; // order of ATTEMPTS in api/detect.ts

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: "string", default: "https://roomspeak.edycu.dev/api/detect" },
    lang: { type: "string", default: "id" },
    json: { type: "string" },
  },
});
const photos = positionals.length ? positionals : ["bedroom", "living", "dining", "kitchen"].map((n) => `public/samples/${n}.jpg`);

const browser = await chromium.launch();
const page = await browser.newPage();

async function prepare(file) {
  const mime = extname(file).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const dataUrl = `data:${mime};base64,${(await readFile(file)).toString("base64")}`;
  return page.evaluate(async ({ dataUrl, maxSide }) => {
    // same steps as preparePhoto() in src/image.ts
    const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob(), { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/jpeg", 0.85);
    return { base64: out.slice(out.indexOf(",") + 1), width: canvas.width, height: canvas.height };
  }, { dataUrl, maxSide: 1600 });
}

const runs = [];
for (const file of photos) {
  const photo = await prepare(file);
  const run = { photo: basename(file), size: `${photo.width}x${photo.height}`, payload_kb: Math.round(photo.base64.length / 1024), run_at: new Date().toISOString() };
  const started = performance.now();
  try {
    const res = await fetch(values.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: photo.base64, lang: values.lang }),
      signal: AbortSignal.timeout(70_000), // the app's own wait (src/detect-client.ts)
    });
    run.http = res.status;
    run.vercel_id = res.headers.get("x-vercel-id");
    run.response = await res.json();
  } catch (err) {
    run.http = 0;
    run.response = { error: String(err) };
  }
  run.seconds = Number(((performance.now() - started) / 1000).toFixed(2));
  run.model = run.response?.model ?? null;
  run.ladder_step = run.model ? LADDER.indexOf(run.model) + 1 || "?" : null;
  run.spots = Array.isArray(run.response?.spots) ? run.response.spots.length : 0;
  runs.push(run);
  console.log(`${run.photo}: HTTP ${run.http}, ${run.spots} spots from ${run.model ?? "-"} (step ${run.ladder_step ?? "-"}) in ${run.seconds} s`);
}
await browser.close();

const secs = runs.filter((r) => r.http === 200).map((r) => r.seconds).sort((a, b) => a - b);
const mid = secs.length >> 1;
const summary = {
  photos: runs.length,
  answered: secs.length,
  p50_s: secs.length ? Number((secs.length % 2 ? secs[mid] : (secs[mid - 1] + secs[mid]) / 2).toFixed(2)) : null,
  max_s: secs.at(-1) ?? null,
  by_model: Object.fromEntries(LADDER.map((m) => [m, runs.filter((r) => r.model === m).length])),
};

console.log("\n| Photo | Payload | HTTP | Answered by | Ladder step | Spots | Wall clock |\n|---|---|---|---|---|---|---|");
for (const r of runs) console.log(`| ${r.photo} | ${r.payload_kb} KB | ${r.http} | \`${r.model ?? "-"}\` | ${r.ladder_step ?? "-"} | ${r.spots} | ${r.seconds} s |`);
console.log(`\n${summary.answered}/${summary.photos} answered · p50 ${summary.p50_s} s · max ${summary.max_s} s · ${JSON.stringify(summary.by_model)}`);

if (values.json) {
  const record = { endpoint: values.url, lang: values.lang, encode: "Chromium canvas, ≤1600 px, JPEG 0.85 (same as src/image.ts)", summary, runs };
  await writeFile(values.json, JSON.stringify(record, null, 1) + "\n");
  console.log(`wrote ${values.json}`);
}
if (summary.answered !== summary.photos) process.exitCode = 1;
