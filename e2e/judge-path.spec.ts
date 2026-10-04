// The 30-second path printed on /judge, on a phone-sized screen: example room → rings → Selesai → tap → it speaks.
// /api/detect answers with fixed spots and speechSynthesis is a recording stub, so this needs no key and no voice.
import { expect, test } from "@playwright/test";
import { FIXTURE_SPOTS, dismissHandoff, spoken, stubSpeech, tapStage } from "./helpers.mjs";

test("an example room becomes rings, and tapping one speaks its phrase", async ({ page }) => {
  await stubSpeech(page);
  const sent: { image: string; lang: string }[] = [];
  await page.route("**/api/detect", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ json: { spots: FIXTURE_SPOTS, model: "stub" } });
  });

  await page.goto("/");
  await page.getByTestId("sample-bedroom").click();
  await expect(page.getByTestId("ring")).toHaveCount(FIXTURE_SPOTS.length);
  expect(sent).toHaveLength(1);
  expect(sent[0].lang).toBe("id");
  expect(sent[0].image.startsWith("/9j/")).toBe(true); // shrunk in the browser and sent as JPEG (FF D8 FF)

  await page.getByRole("button", { name: "Selesai" }).click();
  await expect(page.locator(".speak")).toBeVisible();
  await dismissHandoff(page);
  await tapStage(page, 0.59, 0.475); // centre of the first fixture box
  await expect(page.locator(".ring--active")).toHaveCount(1); // lit while it speaks (the stub talks for 600 ms)
  await expect.poll(() => spoken(page)).toEqual(["Tolong hangatkan makanan"]);
});
