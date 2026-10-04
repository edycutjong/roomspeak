// Slice 2: Speak mode — tap speaks, interrupts, outside does nothing, core row, hold-to-exit.
import { chromium } from "playwright";
import { check, dismissHandoff, spoken, stubDetect, stubSpeech, tapStage } from "./helpers.mjs";

const photo = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await stubSpeech(page);
await stubDetect(page);
await page.goto("http://localhost:5173");
await page.setInputFiles('[data-testid="photo-input"]', photo);
await page.getByRole("button", { name: "Selesai" }).click();
check(await page.locator(".speak").isVisible(), "Selesai opens Speak mode");
check(await page.getByRole("dialog").isVisible(), "first entry shows the caregiver handoff card");
await dismissHandoff(page);

await tapStage(page, 0.59, 0.475); // microwave center
check((await spoken(page)).at(-1) === "Tolong hangatkan makanan", "tapping a ring speaks its phrase");
check((await page.locator(".ring--active").count()) === 1, "the tapped ring pulses");
await page.screenshot({ path: "/tmp/claude-501/rs-slice2.png" });

await tapStage(page, 0.095, 0.51); // curtain
const log = await page.evaluate(() => window.__speech);
check(log.at(-2)?.cancel && log.at(-1)?.speak === "Tolong buka tirainya", "a new tap cancels then speaks the new phrase");

const before = (await spoken(page)).length;
await tapStage(page, 0.5, 0.04); // ceiling, no ring
check((await spoken(page)).length === before, "a tap outside every ring does nothing");

await page.getByRole("button", { name: "Toilet" }).click();
check((await spoken(page)).at(-1) === "Aku mau ke toilet", "core row speaks");

const hold = await page.getByTestId("hold-exit").boundingBox();
await page.mouse.move(hold.x + 20, hold.y + 20);
await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up();
check(await page.locator(".speak").isVisible(), "a short press stays in Speak mode");
check(await page.getByRole("status").filter({ hasText: "Tahan 2 detik" }).isVisible(), "a short press explains the 2-second hold");
await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up();
check(await page.locator(".setup").isVisible(), "a 2-second hold returns to Setup");

// No matching voice → large-text caption
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await stubSpeech(p2, { voices: [{ lang: "en-US", name: "Samantha" }] });
await stubDetect(p2);
await p2.goto("http://localhost:5173");
await p2.setInputFiles('[data-testid="photo-input"]', photo);
await p2.getByRole("button", { name: "Selesai" }).click();
await dismissHandoff(p2);
await tapStage(p2, 0.59, 0.475);
check((await p2.getByTestId("caption").textContent()) === "Tolong hangatkan makanan", "without an Indonesian voice the phrase shows in large text");

// Keyboard: a focused ring speaks on Enter
await p2.getByTestId("ring").nth(1).focus();
await p2.keyboard.press("Enter");
check((await p2.getByTestId("caption").textContent()) === "Tolong buka tirainya", "rings are reachable and speak by keyboard");

await browser.close();
