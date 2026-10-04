// Regression tests named for defects the build actually hit (fixing commit in brackets),
// plus the fallback's fenced-JSON answer, which is a provider quirk rather than a past bug.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../api/detect";

const SPOT = { label: "kettle", phrase: "Aku mau kopi", box_2d: [500, 575, 700, 685] };
const KEPT = { label: "kettle", phrase: "Aku mau kopi", box: [500, 575, 700, 685] };

type Answer = () => Promise<Response>;
const gemini = (spots: unknown[]): Answer => async () =>
  Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(spots) }] } }] });
const deepseek = (content: string): Answer => async () => Response.json({ choices: [{ message: { content } }] });
const overloaded: Answer = async () => new Response("{}", { status: 503 });
// What fetch throws when AbortSignal.timeout() fires.
const timedOut: Answer = () => Promise.reject(new DOMException("The operation was aborted due to timeout", "TimeoutError"));

// Stubs the providers: the n-th call gets the n-th answer. Returns the models asked, in order.
function providers(...answers: Answer[]): string[] {
  const asked: string[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const model = url.includes("deepseek") ? JSON.parse(String(init.body)).model : url.match(/models\/([^:]+)/)?.[1];
    asked.push(model);
    return answers[asked.length - 1]();
  });
  return asked;
}

const detect = () =>
  POST(new Request("http://localhost/api/detect", { method: "POST", body: JSON.stringify({ image: "AAAA", lang: "id" }) }));

describe("api/detect fallback ladder", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    vi.stubEnv("DEEPSEEK_API_KEY", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each([
    ["times out — the TimeoutError used to escape the loop and fail the request [863498a]", timedOut],
    ["answers HTTP 503 'high demand' — the first real call through the helper hit this [6edd9ca]", overloaded],
  ])("when the primary Gemini model %s, the next model still answers", async (_, failure) => {
    const asked = providers(failure, gemini([SPOT]));
    const res = await detect();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ spots: [KEPT], model: "gemini-3.1-flash-lite" });
    expect(asked).toHaveLength(2);
  });

  it("an answer wrapped in ```json fences from the DeepSeek fallback still becomes spots", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-deepseek-key");
    const asked = providers(timedOut, overloaded, deepseek("```json\n" + JSON.stringify({ spots: [SPOT] }) + "\n```"));
    const res = await detect();
    expect(await res.json()).toEqual({ spots: [KEPT], model: "deepseek-flash" });
    expect(asked).toEqual([expect.any(String), "gemini-3.1-flash-lite", "deepseek-flash"]);
  });
});

describe("Vercel function imports", () => {
  // Vercel runs api/*.ts as Node ESM, which needs explicit extensions. Vite, Vitest and tsc all accept
  // extensionless imports, so only the deploy showed the break [cf62a94].
  it("every relative import reachable from api/ ends in .js — extensionless imports broke only on Vercel [cf62a94]", () => {
    const seen = new Set<string>();
    const walk = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const [, spec] of readFileSync(file, "utf8").matchAll(/(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g)) {
        expect(spec, `${file} imports "${spec}"`).toMatch(/\.js$/);
        const target = resolve(dirname(file), spec.replace(/\.js$/, ".ts"));
        expect(existsSync(target), `${file} imports "${spec}", but ${target} does not exist`).toBe(true);
        walk(target);
      }
    };
    for (const name of readdirSync("api").filter((n) => n.endsWith(".ts"))) walk(resolve("api", name));
    expect([...seen]).toEqual(expect.arrayContaining([resolve("api/detect.ts"), resolve("shared/prompt.ts"), resolve("shared/validate.ts")]));
  });
});
