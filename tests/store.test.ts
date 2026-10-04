import { describe, expect, it } from "vitest";
import { loadScene, saveScene, type Scene } from "../src/scene";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() { return m.size; },
  };
}

const scene: Scene = {
  version: 1, lang: "id", photo: "data:image/jpeg;base64,AAA", aspect: 1.5,
  spots: [{ id: "a", label: "kettle", phrase: "Aku mau kopi", x: 0.4, y: 0.5, r: 0.06, source: "ai" }],
};

describe("scene store", () => {
  it("round-trips the scene", () => {
    const st = memoryStorage();
    expect(saveScene(scene, st)).toBe(true);
    expect(loadScene(st)).toEqual(scene);
  });
  it("treats missing or corrupt data as no scene", () => {
    const st = memoryStorage();
    expect(loadScene(st)).toBeNull();
    st.setItem("roomspeak.scene.v1", "{not json");
    expect(loadScene(st)).toBeNull();
    st.setItem("roomspeak.scene.v1", JSON.stringify({ ...scene, spots: [{ id: "a" }] }));
    expect(loadScene(st)).toBeNull();
  });
  it("reports a failed save instead of throwing", () => {
    const st = memoryStorage();
    st.setItem = () => { throw new Error("QuotaExceededError"); };
    expect(saveScene(scene, st)).toBe(false);
  });
});
