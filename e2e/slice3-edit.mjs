// Slice 3: hear, edit, remove, add spot, 12-spot cap.
import { chromium } from "playwright";
import { FIXTURE_SPOTS, check, dismissHandoff, openRow, spoken, stubDetect, stubSpeech, tapStage } from "./helpers.mjs";

const photo = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await stubSpeech(page);
await stubDetect(page);
await page.goto("http://localhost:5173");
await page.setInputFiles('[data-testid="photo-input"]', photo);
const rows = page.getByTestId("spot-row");
await rows.first().waitFor();
const rings = () => page.getByTestId("ring").count();

await openRow(page, 0);
check((await spoken(page)).at(-1) === "Tolong hangatkan makanan", "tapping a row speaks the spot");
check(await rows.nth(0).getByRole("button", { name: "Hapus" }).isVisible(), "tapping a row reveals its actions");

await tapStage(page, 0.59, 0.475);
check((await spoken(page)).length === 2, "tapping a ring in Setup speaks it");

await openRow(page, 2);
await rows.nth(2).getByRole("button", { name: "Hapus" }).click();
check((await rows.count()) === 2 && (await rings()) === 2, "Hapus removes the row and its ring");
await page.getByRole("button", { name: "Urungkan" }).click();
check((await rows.count()) === 3, "Urungkan brings the spot back");
await openRow(page, 2);
await rows.nth(2).getByRole("button", { name: "Hapus" }).click();

await openRow(page, 0);
await rows.nth(0).getByRole("button", { name: "Ubah" }).click();
await rows.nth(0).locator("input").fill("Aku lapar, tolong panaskan");
await rows.nth(0).getByRole("button", { name: "Simpan" }).click();
await openRow(page, 0);
check((await spoken(page)).at(-1) === "Aku lapar, tolong panaskan", "an edited phrase is what gets spoken");

await page.getByTestId("add-spot").click();
await tapStage(page, 0.62, 0.62); // blue bag
await page.getByTestId("add-phrase").fill("Ambilkan selimutku");
await page.getByRole("button", { name: "Simpan" }).click();
check((await rings()) === 3 && (await rows.nth(2).textContent()).includes("Ambilkan selimutku"), "Tambah titik adds a ring with the typed phrase");
await page.screenshot({ path: "/tmp/claude-501/rs-slice3.png", fullPage: true });

await page.getByRole("button", { name: "Selesai" }).click();
await dismissHandoff(page);
await tapStage(page, 0.62, 0.62);
check((await spoken(page)).at(-1) === "Ambilkan selimutku", "the added spot speaks in Speak mode");

// Cap: 12 spots → add disabled
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await stubSpeech(p2);
await stubDetect(p2, FIXTURE_SPOTS);
await p2.goto("http://localhost:5173");
await p2.setInputFiles('[data-testid="photo-input"]', photo);
await p2.getByTestId("spot-row").first().waitFor();
for (let i = 0; i < 9; i++) {
  await p2.getByTestId("add-spot").click();
  await tapStage(p2, 0.1 + i * 0.08, 0.9);
  await p2.getByTestId("add-phrase").fill(`titik ${i}`);
  await p2.getByRole("button", { name: "Simpan" }).click();
}
check((await p2.getByTestId("ring").count()) === 12, "12 spots in the scene");
check(await p2.getByTestId("add-spot").isDisabled(), "Tambah titik is disabled at 12");

await browser.close();
