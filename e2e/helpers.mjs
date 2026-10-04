// Shared Playwright helpers: a recording speechSynthesis stub and a fixed /api/detect answer.
export const FIXTURE_SPOTS = [
  { label: "microwave", phrase: "Tolong hangatkan makanan", box: [400, 480, 550, 700] },
  { label: "tirai", phrase: "Tolong buka tirainya", box: [190, 0, 830, 190] },
  { label: "botol", phrase: "Aku mau minum", box: [367, 717, 463, 795] },
];

export async function stubSpeech(page, { voices = [{ lang: "id-ID", name: "Damayanti" }] } = {}) {
  await page.addInitScript((voices) => {
    window.__speech = [];
    let current = null;
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
    const end = (u, type) => u && (type === "end" ? u.onend?.() : u.onerror?.());
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => voices,
        addEventListener() {},
        removeEventListener() {},
        cancel() { window.__speech.push({ cancel: true }); end(current, "error"); current = null; },
        speak(u) {
          window.__speech.push({ speak: u.text, lang: u.lang });
          current = u;
          setTimeout(() => { if (current === u) { end(u, "end"); current = null; } }, 600);
        },
      },
    });
  }, voices);
}

export async function stubDetect(page, spots = FIXTURE_SPOTS, status = 200) {
  await page.route("**/api/detect", (route) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(status === 200 ? { spots } : { error: "x" }) }),
  );
}

// Click the stage at a fraction of the photo (fx, fy).
export async function tapStage(page, fx, fy) {
  const box = await page.getByTestId("stage").boundingBox();
  await page.mouse.click(box.x + fx * box.width, box.y + fy * box.height);
}

export const spoken = (page) => page.evaluate(() => window.__speech.filter((e) => e.speak).map((e) => e.speak));

export function check(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}
