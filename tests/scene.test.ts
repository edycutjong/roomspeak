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

import { separateSpots } from "../src/scene";

describe("separateSpots", () => {
  const s = (id: string, x: number, y: number) => ({ id, label: id, phrase: id, x, y, r: 0.05, source: "ai" as const });
  it("pushes overlapping rings apart, within the max shift", () => {
    const [a, b] = separateSpots([s("a", 0.5, 0.5), s("b", 0.51, 0.5)], 1.5);
    expect(b.x - a.x).toBeGreaterThan(0.08);
    expect(Math.abs(a.x - 0.5)).toBeLessThanOrEqual(0.05 + 1e-9);
  });
  it("leaves well-spaced rings alone", () => {
    const input = [s("a", 0.2, 0.3), s("b", 0.7, 0.6)];
    expect(separateSpots(input, 1.5)).toEqual(input);
  });
});
