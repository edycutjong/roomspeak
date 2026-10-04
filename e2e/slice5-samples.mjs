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

// Ganti foto: the confirmation also offers the example rooms; picking one replaces the scene.
{
  const b2 = await chromium.launch();
  const page = await b2.newPage({ viewport: { width: 390, height: 844 } });
  await stubSpeech(page);
  let n = 0;
  await page.route("**/api/detect", (route) => {
    n++;
    const spots = n === 1
      ? [{ label: "walker", phrase: "Bantu aku jalan", box: [300, 300, 800, 450] }, { label: "radio", phrase: "Nyalakan radio", box: [100, 100, 200, 200] }]
      : [{ label: "kompor", phrase: "Matikan kompornya", box: [400, 400, 500, 600] }];
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ spots }) });
  });
  await page.goto("http://localhost:5173");
  await page.getByTestId("sample-bedroom").click();
  await page.getByTestId("spot-row").nth(1).waitFor();
  await page.getByTestId("replace-photo").click();
  check((await page.locator(".samples--compact .sample").count()) === 4, "Ganti foto offers the 4 example rooms");
  await page.screenshot({ path: "/tmp/claude-501/replace-samples.png", fullPage: true });
  await page.locator(".samples--compact").getByTestId("sample-kitchen").click();
  await page.getByText("Matikan kompornya").waitFor();
  check((await page.getByTestId("ring").count()) === 1 && n === 2, "picking an example there replaces the scene");
  check((await page.locator(".samples--compact").count()) === 0, "the confirmation closes after picking");
  await b2.close();
}
