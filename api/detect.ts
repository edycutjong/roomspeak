// POST /api/detect — room photo in, validated talk-about spots out.
// Runs as a Vercel function in production and through Vite middleware locally.
import { buildPrompt, JSON_OBJECT_SUFFIX, RESPONSE_SCHEMA, type Lang } from "../shared/prompt.js";
import { parseModelJson, validateSpots } from "../shared/validate.js";

const MAX_BODY_CHARS = 4_000_000;
const TOTAL_BUDGET_MS = 55_000; // stays under the browser's 70 s wait and the function's maxDuration

type Attempt = {
  name: string;
  ms: number; // this attempt's own time limit
  key: () => string | undefined;
  run: (image: string, lang: Lang, key: string, signal: AbortSignal) => Promise<unknown>;
};

async function gemini(model: string, image: string, lang: Lang, key: string, signal: AbortSignal) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: image } }, { text: buildPrompt(lang) }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0.2 },
    }),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" ? JSON.parse(text) : [];
}

// Any OpenAI-compatible chat endpoint (here: DeepSeek's own API) with image input and a JSON-object answer.
async function chat(url: string, model: string, extra: object, image: string, lang: Lang, key: string, signal: AbortSignal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: [
        { type: "text", text: buildPrompt(lang) + JSON_OBJECT_SUFFIX },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
      ] }],
      ...extra,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = (await res.json())?.choices?.[0]?.message?.content;
  return typeof text === "string" ? parseModelJson(text) : [];
}

const DEEPSEEK = "https://api.deepseek.com/chat/completions";

// Fallback ladder, ordered by box accuracy measured on the same rooms (see README):
// Gemini is the most precise and fast; DeepSeek's own API (V4.1 Flash, low effort) is a close, slightly looser second.
// Providers without a configured key are skipped.
const ATTEMPTS: Attempt[] = [
  { name: process.env.GEMINI_MODEL || "gemini-3.8-flash", ms: 12_000, key: () => process.env.GEMINI_API_KEY,
    run: (i, l, k, s) => gemini(process.env.GEMINI_MODEL || "gemini-3.8-flash", i, l, k, s) },
  { name: "gemini-3.1-flash-lite", ms: 10_000, key: () => process.env.GEMINI_API_KEY,
    run: (i, l, k, s) => gemini("gemini-3.1-flash-lite", i, l, k, s) },
  { name: "deepseek-flash", ms: 25_000, key: () => process.env.DEEPSEEK_API_KEY,
    run: (i, l, k, s) => chat(DEEPSEEK, "deepseek-flash", { reasoning_effort: "low" }, i, l, k, s) },
];

async function findSpots(image: string, lang: Lang) {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const tried: string[] = [];
  for (const a of ATTEMPTS) {
    const key = a.key();
    if (!key) continue;
    const left = deadline - Date.now();
    if (left < 4_000) break;
    try {
      const raw = await a.run(image, lang, key, AbortSignal.timeout(Math.min(a.ms, left)));
      return { spots: validateSpots(raw), model: a.name };
    } catch (err) {
      tried.push(`${a.name}: ${(err as Error).name === "Error" ? (err as Error).message : (err as Error).name}`);
    }
  }
  throw new Error(tried.length ? tried.join("; ") : "no provider key configured");
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export async function POST(request: Request): Promise<Response> {
  if (!ATTEMPTS.some((a) => a.key())) return json(500, { error: "Server has no AI provider key (GEMINI_API_KEY or DEEPSEEK_API_KEY)." });

  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return json(413, { error: "Photo is too large." });

  let image: unknown, lang: unknown;
  try {
    ({ image, lang } = JSON.parse(text));
  } catch {
    return json(400, { error: "Body must be JSON." });
  }
  if (typeof image !== "string" || !image) return json(400, { error: "Missing image." });
  if (lang !== "id" && lang !== "en") return json(400, { error: "lang must be id or en." });

  try {
    return json(200, await findSpots(image, lang));
  } catch (err) {
    return json(502, { error: "Could not look for objects right now.", detail: String(err) });
  }
}
