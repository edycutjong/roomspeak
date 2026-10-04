// /judge is the page a judge opens first, so it must work for anyone: no login, no cookies, no session.
import { expect, test } from "@playwright/test";

const CLAIM = "One photo of his room becomes his voice. Tap an object, and it speaks for him.";

test.use({ storageState: { cookies: [], origins: [] } });

test("/judge/ answers 200 with the claim, without credentials or a session", async ({ request }) => {
  const res = await request.get("/judge/");
  expect(res.status()).toBe(200);
  expect(res.headers()["set-cookie"]).toBeUndefined();
  expect(await res.text()).toContain(CLAIM);
});

test("/judge opens the page, and every link on it to this site resolves", async ({ page, request }) => {
  await page.goto("/judge");
  await expect(page).toHaveURL(/\/judge\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(CLAIM);
  const origin = new URL(page.url()).origin;
  const hrefs = await page.locator("a[href]").evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
  const local = [...new Set(hrefs.filter((h) => new URL(h).origin === origin).map((h) => h.split("#")[0]))];
  expect(local.length).toBeGreaterThanOrEqual(3); // the app, /story/, /deck/
  for (const href of local) expect((await request.get(href)).status(), href).toBe(200);
});
