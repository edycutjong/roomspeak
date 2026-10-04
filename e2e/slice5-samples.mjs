// Example rooms: one tap on a sample runs the normal setup flow (stubbed detect here).
import { chromium } from "playwright";
import { check, stubDetect, stubSpeech } from "./helpers.mjs";

const browser = await chromium.launch();
for (const vp of [{ width: 390, height: 844 }, { width: 1180, height: 820 }]) {
  const page = await browser.newPage({ viewport: vp });
  await stubSpeech(page);
  let sent = 0;
  await page.route("**/api/detect", (route) => {
    sent++;
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ spots: [{ label: "walker", phrase: "Bantu aku jalan", box: [300, 300, 800, 450] }] }) });
  });
  await page.goto("http://localhost:5173");
  check((await page.locator(".sample").count()) === 4, `4 example rooms shown (${vp.width}px)`);
  check(await page.getByText(/dibuat dengan AI/).isVisible(), "example photos are labelled AI-generated");
  await page.getByTestId("sample-bedroom").click();
  await page.getByTestId("spot-row").first().waitFor();
  check(sent === 1 && (await page.getByTestId("ring").count()) === 1, "tapping an example room runs detection and shows rings");
  await page.screenshot({ path: `/tmp/claude-501/samples-${vp.width}.png`, fullPage: true });
}
await browser.close();
