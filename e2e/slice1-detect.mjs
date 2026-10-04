// Slice 1: choosing a room photo shows rings + phrases (real /api/detect call).
// Usage: node e2e/slice1-detect.mjs <photo> [outScreenshot]   (dev server on :5173)
import { chromium } from "playwright";

const [photo, shot = "/tmp/rs-slice1.png"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173");
await page.setInputFiles('[data-testid="photo-input"]', photo);
await page.getByRole("status").waitFor();
await page.locator('[data-testid="spot-list"] li').first().waitFor({ timeout: 90_000 });
await page.waitForTimeout(1500); // let the staggered ring reveal finish
const rings = await page.locator('[data-testid="ring"]').count();
const phrases = await page.locator(".spot__phrase").allTextContents();
await page.screenshot({ path: shot, fullPage: true });
console.log(JSON.stringify({ rings, phrases }, null, 1));
await browser.close();
if (rings < 1 || rings !== phrases.length) process.exit(1);
