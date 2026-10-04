// Property test for validateSpots, the gate between a model's answer and the rings he taps.
// Answers are built from spots that are valid or invalid by construction, so the expected result is known
// without re-implementing the validator: invalid spots never get through, valid ones are kept in order up to the cap.
import fc from "fast-check";
import { expect, it } from "vitest";
import { MAX_AI_SPOTS, validateSpots, type DetectedSpot } from "../shared/validate";

const CASES = 100_000;

const coord = fc.integer({ min: 0, max: 1000 });
// ymin < ymax and xmin < xmax, every value inside 0–1000
const box = fc
  .tuple(coord, coord, coord, coord)
  .filter(([y1, x1, y2, x2]) => y1 !== y2 && x1 !== x2)
  .map(([y1, x1, y2, x2]) => [Math.min(y1, y2), Math.min(x1, x2), Math.max(y1, y2), Math.max(x1, x2)]);
const words = fc.string({ unit: "grapheme", minLength: 1, maxLength: 30 }).filter((s) => s.trim() !== "");
const space = fc.constantFrom("", " ", "\n", "\t ", " ");

// A spot the validator must keep. A missing or blank label falls back to the phrase.
const good = fc.record({
  label: fc.oneof(words, space, fc.constant(undefined)),
  phrase: fc.tuple(space, words, space).map(([a, w, b]) => a + w + b),
  box_2d: box,
});
type Good = { label?: string; phrase: string; box_2d: number[] };

// A box that breaks exactly one rule.
const notInRange = fc.oneof(
  fc.integer({ min: 1001 }),
  fc.integer({ max: -1 }),
  fc.constantFrom(1000.5, -0.5, Number.NaN, Infinity, -Infinity),
  fc.string(),
  fc.constant(null),
);
const badBox = fc.oneof(
  fc.tuple(box, fc.nat(3), notInRange).map(([b, i, v]) => Object.assign([...b], { [i]: v })),
  box.map(([y1, x1, y2, x2]) => [y2, x1, y1, x2]), // ymin > ymax
  box.map(([y1, x1, y2, x2]) => [y1, x2, y2, x1]), // xmin > xmax
  box.map(([y1, x1, , x2]) => [y1, x1, y1, x2]), // zero height
  fc.array(coord, { maxLength: 7 }).filter((a) => a.length !== 4),
  fc.oneof(fc.string(), fc.integer(), fc.constant(null), fc.dictionary(fc.string(), coord)),
);

// A spot the validator must drop.
const bad = fc.oneof(
  good.chain((s) => fc.oneof(space, fc.integer(), fc.constant(null), fc.array(words)).map((phrase) => ({ ...s, phrase }))),
  good.chain((s) => badBox.map((box_2d) => ({ ...s, box_2d }))),
  good.map(({ label, phrase }) => ({ label, phrase })), // no box
  good.map(({ label, box_2d }) => ({ label, box_2d })), // no phrase
  fc.oneof(fc.constant(null), fc.integer(), words, fc.array(coord)), // not a spot at all
);

const answer = fc.oneof(
  {
    weight: 9,
    arbitrary: fc
      .array(fc.oneof(good.map((v) => ({ v, keep: true })), bad.map((v) => ({ v, keep: false }))), { maxLength: 24, size: "max" })
      .map((items) => ({ raw: items.map((i) => i.v) as unknown, kept: items.filter((i) => i.keep).map((i) => i.v as Good) })),
  },
  { weight: 1, arbitrary: fc.anything().map((raw) => ({ raw, kept: null as Good[] | null })) },
);

// The invariants every returned spot must hold, whatever came in.
function problem(out: DetectedSpot[]): string | null {
  if (!Array.isArray(out)) return "not an array";
  if (out.length > MAX_AI_SPOTS) return `${out.length} spots, more than ${MAX_AI_SPOTS}`;
  for (const { label, phrase, box } of out) {
    if (box.length !== 4 || !box.every((v) => Number.isFinite(v) && v >= 0 && v <= 1000)) return `box outside 0–1000: ${box}`;
    if (box[0] >= box[2] || box[1] >= box[3]) return `box with min ≥ max: ${box}`;
    if (!phrase.trim() || phrase !== phrase.trim()) return `blank or untrimmed phrase: ${JSON.stringify(phrase)}`;
    if (!label.trim()) return "blank label";
  }
  return null;
}

it(`validateSpots never lets an invalid spot through (${CASES.toLocaleString("en-US")} generated answers)`, () => {
  let runs = 0, items = 0, capped = 0;
  fc.assert(
    fc.property(answer, ({ raw, kept }) => {
      runs++;
      items += Array.isArray(raw) ? raw.length : 1;
      const out = validateSpots(raw);
      const p = problem(out);
      if (p) throw new Error(p);
      if (!kept) return;
      if (kept.length > MAX_AI_SPOTS) capped++;
      const want = kept.slice(0, MAX_AI_SPOTS).map((g) => ({
        label: typeof g.label === "string" && g.label.trim() ? g.label.trim() : g.phrase.trim(),
        phrase: g.phrase.trim(),
        box: g.box_2d,
      }));
      if (JSON.stringify(out) !== JSON.stringify(want)) throw new Error(`kept ${JSON.stringify(out)}, expected ${JSON.stringify(want)}`);
    }),
    { numRuns: CASES },
  );
  expect(runs).toBe(CASES);
  expect(capped).toBeGreaterThan(CASES / 100); // the 8-spot cap really gets exercised
  console.log(`validateSpots: ${runs.toLocaleString("en-US")} generated answers, ${items.toLocaleString("en-US")} items, ${capped.toLocaleString("en-US")} over the cap, 0 invalid spots kept`);
}, 120_000); // ~5 s on a laptop; slower on CI runners and under coverage, and Vitest's default limit is 5 s
