// Slice 4: scene survives reload; first open → Setup; failure/empty/voice/replace states.
import { chromium } from "playwright";
import { check, dismissHandoff, openRow, spoken, stubDetect, stubSpeech, tapStage } from "./helpers.mjs";

const photo = process.argv[2];
const browser = await chromium.launch();

// Persistence
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await stubSpeech(page);
await stubDetect(page);
await page.goto("http://localhost:5173");
check(await page.getByTestId("photo-input").count() === 1 && await page.locator(".setup").isVisible(), "first open shows Setup");
await page.setInputFiles('[data-testid="photo-input"]', photo);
await page.getByTestId("spot-row").first().waitFor();
await openRow(page, 1);
await page.getByTestId("spot-row").nth(1).getByRole("button", { name: "Hapus" }).click();
await page.getByRole("button", { name: "Selesai" }).click();
await dismissHandoff(page);
await page.reload();
check(await page.locator(".speak").isVisible(), "reopening goes straight to Speak");
check(!(await page.getByRole("dialog").isVisible()), "the handoff card is shown only once");
check((await page.getByTestId("ring").count()) === 2, "the saved scene keeps the edited spots");
await tapStage(page, 0.59, 0.475);
check((await spoken(page)).at(-1) === "Tolong hangatkan makanan", "a saved ring still speaks after reopening");

// Replace photo asks first
const hold = await page.getByTestId("hold-exit").boundingBox();
await page.mouse.move(hold.x + 20, hold.y + 20);
await page.mouse.down(); await page.waitForTimeout(2200); await page.mouse.up();
await page.getByTestId("replace-photo").click();
check(await page.getByText("Ganti foto? Semua titik").isVisible(), "choosing a new photo asks for confirmation");
await page.getByRole("button", { name: "Batal" }).click();
check((await page.getByTestId("ring").count()) === 2, "cancel keeps the scene");

// Failure → Coba lagi, Add spot still works
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await stubSpeech(p2);
await stubDetect(p2, [], 502);
await p2.goto("http://localhost:5173");
await p2.setInputFiles('[data-testid="photo-input"]', photo);
await p2.getByRole("button", { name: "Coba lagi" }).waitFor();
check(true, "a failed request shows Coba lagi");
await p2.screenshot({ path: "/tmp/claude-501/rs-slice4-failed.png", fullPage: true });
await p2.getByTestId("add-spot").click();
await tapStage(p2, 0.5, 0.5);
await p2.getByTestId("add-phrase").fill("Aku mau minum");
await p2.getByRole("button", { name: "Simpan" }).click();
check((await p2.getByTestId("ring").count()) === 1, "Add spot works after a failure");
await p2.unroute("**/api/detect");
await stubDetect(p2);
await p2.getByRole("button", { name: "Coba lagi" }).click();
await p2.getByTestId("spot-row").nth(2).waitFor();
check((await p2.getByTestId("ring").count()) === 3, "Coba lagi retries and fills the spots");

// Nothing found
const p3 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await stubSpeech(p3);
await stubDetect(p3, []);
await p3.goto("http://localhost:5173");
await p3.setInputFiles('[data-testid="photo-input"]', photo);
await p3.getByText("Belum ada benda yang jelas").waitFor();
check(true, "an empty result explains what to try");

// Missing voice notice
const p4 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await stubSpeech(p4, { voices: [] });
await stubDetect(p4);
await p4.goto("http://localhost:5173");
await p4.setInputFiles('[data-testid="photo-input"]', photo);
await p4.getByText("belum punya suara Bahasa Indonesia").waitFor();
check(true, "Setup warns when there is no Indonesian voice");

await browser.close();
