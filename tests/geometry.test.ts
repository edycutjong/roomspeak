import { describe, expect, it } from "vitest";
import { nearestRing } from "../src/geometry";
import type { Spot } from "../src/scene";

const spot = (id: string, x: number, y: number, r = 0.05): Spot => ({ id, label: id, phrase: id, x, y, r, source: "ai" });
const W = 1000, H = 600;

describe("nearestRing", () => {
  it("hits a ring when the tap is inside it", () => {
    expect(nearestRing([spot("a", 0.5, 0.5)], 0.52, 0.5, W, H)?.id).toBe("a");
  });
  it("misses when the tap is outside every ring", () => {
    expect(nearestRing([spot("a", 0.5, 0.5)], 0.9, 0.1, W, H)).toBeNull();
  });
  it("picks the nearest center when rings overlap", () => {
    const spots = [spot("a", 0.5, 0.5, 0.08), spot("b", 0.56, 0.5, 0.08)];
    expect(nearestRing(spots, 0.545, 0.5, W, H)?.id).toBe("b");
    expect(nearestRing(spots, 0.51, 0.5, W, H)?.id).toBe("a");
  });
  it("uses the minimum tap size for tiny rings", () => {
    // r*W = 10px, but the drawn ring is at least 64px wide → 32px radius
    expect(nearestRing([spot("a", 0.5, 0.5, 0.01)], 0.525, 0.5, W, H)?.id).toBe("a");
  });
});
