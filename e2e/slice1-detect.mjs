// Slice 1: choosing a room photo shows rings + phrases (real /api/detect call).
// Usage: node e2e/slice1-detect.mjs <photo> [outScreenshot]   (dev server on :5173)
import { chromium } from "playwright";

const [photo, shot = "/tmp/rs-slice1.png"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173");
const answer = page.waitForResponse((r) => r.url().endsWith("/api/detect"), { timeout: 90_000 }).catch(() => null);
await page.setInputFiles('[data-testid="photo-input"]', photo);
// Wait for the first spot, or stop early with the server's own reason if detection failed
// (no key on the dev server, a provider's quota or outage).
const firstSpot = page.locator('[data-testid="spot-list"] li').first();
const retry = page.getByRole("button", { name: /Coba lagi|Try again/ });
await firstSpot.or(retry).first().waitFor({ timeout: 90_000 });
if (await retry.isVisible()) {
  const res = await answer;
  const body = res ? await res.json().catch(() => ({})) : {};
  console.error(`FAIL: /api/detect answered ${res?.status() ?? "nothing"}: ${body.detail ?? body.error ?? "no detail"}`);
  console.error("This script calls the real AI providers through the dev server: set GEMINI_API_KEY (or DEEPSEEK_API_KEY) for it, with quota left.");
  await browser.close();
  process.exit(1);
}
await page.waitForTimeout(1500); // let the staggered ring reveal finish
const rings = await page.locator('[data-testid="ring"]').count();
const phrases = await page.locator(".spot__phrase").allTextContents();
await page.screenshot({ path: shot, fullPage: true });
console.log(JSON.stringify({ rings, phrases }, null, 1));
await browser.close();
if (rings < 1 || rings !== phrases.length) process.exit(1);
