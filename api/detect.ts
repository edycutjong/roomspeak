// POST /api/detect — room photo in, validated talk-about spots out.
// Runs as a Vercel function in production and through Vite middleware locally.
import { buildPrompt, RESPONSE_SCHEMA, type Lang } from "../shared/prompt";
import { validateSpots } from "../shared/validate";

// Primary model first; on overload, retry, then fall back to the next model.
const MODELS = [process.env.GEMINI_MODEL || "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
const MAX_BODY_CHARS = 4_000_000;
const RETRYABLE = new Set([429, 500, 503]);

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function askGemini(image: string, lang: Lang, key: string): Promise<unknown> {
  const body = JSON.stringify({
    contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: image } }, { text: buildPrompt(lang) }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0.2 },
  });
  let last = "";
  for (const [attempt, model] of [MODELS[0], MODELS[0], MODELS[1], MODELS[2]].entries()) {
    if (attempt) await new Promise((r) => setTimeout(r, 800 * attempt));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body,
      signal: AbortSignal.timeout(25_000),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return typeof text === "string" ? JSON.parse(text) : [];
    }
    last = `Gemini ${model} ${res.status}`;
    if (!RETRYABLE.has(res.status)) break;
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
