// POST /api/detect — room photo in, validated talk-about spots out.
// Runs as a Vercel function in production and through Vite middleware locally.
import { buildPrompt, RESPONSE_SCHEMA, type Lang } from "../shared/prompt";
import { validateSpots } from "../shared/validate";

// Primary model first; on overload or timeout, fall back to the next model within one time budget.
const MODELS = [process.env.GEMINI_MODEL || "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-3.6-flash"];
const MAX_BODY_CHARS = 4_000_000;
const RETRYABLE = new Set([429, 500, 503]);
const ATTEMPT_MS = 12_000;
const TOTAL_BUDGET_MS = 50_000; // stays under the browser's 60 s wait

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function askGemini(image: string, lang: Lang, key: string): Promise<unknown> {
  const body = JSON.stringify({
    contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: image } }, { text: buildPrompt(lang) }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0.2 },
  });
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let last = "";
  for (const model of MODELS) {
    const left = deadline - Date.now();
    if (left < 4_000) break;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
        signal: AbortSignal.timeout(Math.min(ATTEMPT_MS, left)),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return typeof text === "string" ? JSON.parse(text) : [];
      }
      last = `Gemini ${model} ${res.status}`;
      if (!RETRYABLE.has(res.status)) break;
    } catch (err) {
      last = `Gemini ${model} ${(err as Error).name}`; // timeout or network: try the next attempt
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(last);
}

export async function POST(request: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(500, { error: "Server is missing GEMINI_API_KEY." });

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
    const spots = validateSpots(await askGemini(image, lang, key));
    return json(200, { spots });
  } catch (err) {
    return json(502, { error: "Could not look for objects right now.", detail: String(err) });
  }
}
