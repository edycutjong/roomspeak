import { describe, expect, it } from "vitest";
import { validateSpots } from "../shared/validate";

describe("validateSpots", () => {
  it("keeps well-formed spots", () => {
    expect(validateSpots([{ label: "kettle", phrase: " Saya mau kopi ", box_2d: [100, 200, 300, 400] }])).toEqual([
      { label: "kettle", phrase: "Saya mau kopi", box: [100, 200, 300, 400] },
    ]);
  });
  it("drops malformed items", () => {
    const raw = [
      { label: "a", phrase: "", box_2d: [1, 2, 3, 4] },
      { label: "b", phrase: "x", box_2d: [1, 2, 3] },
      { label: "c", phrase: "x", box_2d: [300, 2, 100, 4] },
      { label: "d", phrase: "x", box_2d: [1, 2, 3, 1200] },
      { label: "e", phrase: "x", box_2d: ["1", 2, 3, 4] },
      null,
    ];
    expect(validateSpots(raw)).toEqual([]);
  });
  it("caps at 8 and tolerates non-arrays", () => {
    const many = Array.from({ length: 11 }, () => ({ label: "x", phrase: "y", box_2d: [0, 0, 10, 10] }));
    expect(validateSpots(many)).toHaveLength(8);
    expect(validateSpots({ spots: [] })).toEqual([]);
  });
  it("falls back to the phrase when the label is missing", () => {
    expect(validateSpots([{ phrase: "Buka jendela", box_2d: [0, 0, 10, 10] }])[0].label).toBe("Buka jendela");
  });
});
