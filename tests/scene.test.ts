import { describe, expect, it } from "vitest";
import { boxToSpot } from "../src/scene";

describe("boxToSpot", () => {
  it("centers the ring on the box", () => {
    const s = boxToSpot([200, 100, 400, 300], "kettle", "Saya mau kopi", 1.5);
    expect(s.x).toBeCloseTo(0.2);
    expect(s.y).toBeCloseTo(0.3);
    expect(s.source).toBe("ai");
  });
  it("keeps the radius within calm bounds", () => {
    expect(boxToSpot([0, 0, 1000, 1000], "wall", "x", 1).r).toBe(0.08);
    expect(boxToSpot([500, 500, 505, 505], "tiny", "x", 1).r).toBe(0.03);
  });
});
