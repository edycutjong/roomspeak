// Permission boundary: the provider keys live only in the serverless function, never in what the browser downloads.
// Builds the client with canary keys in the environment (where Vercel holds the real ones), then searches every
// built file for them, for key-shaped strings, and for the providers' own URLs.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CANARY = { GEMINI_API_KEY: `gemini-canary-${randomUUID()}`, DEEPSEEK_API_KEY: `deepseek-canary-${randomUUID()}` };
const TEXT = new Set([".html", ".js", ".css", ".json", ".svg", ".txt", ".map", ".webmanifest"]);
const outDir = mkdtempSync(join(tmpdir(), "roomspeak-dist-"));
let files: string[] = [];
const textFiles = () => files.filter((f) => TEXT.has(extname(f))).map((f) => ({ file: relative(outDir, f), body: readFileSync(f, "utf8") }));

beforeAll(() => {
  execFileSync(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--outDir", outDir, "--emptyOutDir", "--logLevel", "error"], {
    env: { ...process.env, ...CANARY },
    stdio: "pipe",
  });
  files = readdirSync(outDir, { recursive: true, withFileTypes: true }).filter((d) => d.isFile()).map((d) => join(d.parentPath, d.name));
}, 120_000);

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe("no API key reaches the browser", () => {
  it("keys set at build time appear in no built file (HTML, JS, CSS, JSON, images)", () => {
    expect(files.map((f) => relative(outDir, f))).toContain("index.html");
    for (const f of files) {
      const bytes = readFileSync(f);
      for (const [name, value] of Object.entries(CANARY)) expect(bytes.includes(value), `${name} leaked into ${relative(outDir, f)}`).toBe(false);
    }
  });

  it("no text asset holds a key-shaped string or a key variable with a value", () => {
    const shapes = [
      /AIza[0-9A-Za-z_-]{35}/, // Google API key
      /\bsk-[A-Za-z0-9_-]{20,}/, // DeepSeek / OpenAI-style secret key
      /(?:GEMINI|DEEPSEEK)_API_KEY["']?\s*[:=]\s*["']?[^\s"',;}]{6,}/, // env var name with a value
    ];
    for (const { file, body } of textFiles()) for (const shape of shapes) expect(body.match(shape)?.[0], file).toBeUndefined();
  });

  it("the browser calls /api/detect only, never an AI provider directly", () => {
    const js = textFiles().filter(({ file }) => file.endsWith(".js"));
    expect(js.some(({ body }) => body.includes("/api/detect"))).toBe(true);
    for (const { file, body } of js) expect(body, file).not.toMatch(/generativelanguage\.googleapis\.com|api\.deepseek\.com/);
  });
});
