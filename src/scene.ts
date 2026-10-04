import type { Lang } from "../shared/prompt";
import type { Box } from "../shared/validate";

export type Spot = {
  id: string;
  label: string;
  phrase: string;
  x: number; // ring center, fraction of photo width
  y: number; // ring center, fraction of photo height
  r: number; // ring radius, fraction of photo width
  source: "ai" | "manual";
};

export type Scene = { version: 1; lang: Lang; photo: string; aspect: number; spots: Spot[] };

export const MAX_SPOTS = 12;
export const DEFAULT_R = 0.06;

export const newId = () => Math.random().toString(36).slice(2, 10);

// A box becomes a soft ring centered on the object, sized to the object but kept within calm bounds.
// aspect = photo width / height.
export function boxToSpot(box: Box, label: string, phrase: string, aspect: number): Spot {
  const [ymin, xmin, ymax, xmax] = box.map((v) => v / 1000);
  const boxW = xmax - xmin;
  const boxHInWidthUnits = (ymax - ymin) / aspect;
  const r = Math.min(0.08, Math.max(0.03, 0.3 * Math.min(boxW, boxHInWidthUnits)));
  return { id: newId(), label, phrase, x: (xmin + xmax) / 2, y: (ymin + ymax) / 2, r, source: "ai" };
}

const KEY = "roomspeak.scene.v1";

// The one saved scene. Anything missing or malformed counts as "no scene" → Setup.
export function loadScene(storage: Storage | undefined = globalThis.localStorage): Scene | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const ok =
      s?.version === 1 &&
      (s.lang === "id" || s.lang === "en") &&
      typeof s.photo === "string" && s.photo.startsWith("data:image/") &&
      typeof s.aspect === "number" && s.aspect > 0 &&
      Array.isArray(s.spots) &&
      s.spots.every(
        (p: Spot) =>
          typeof p?.id === "string" && typeof p.phrase === "string" &&
          [p.x, p.y, p.r].every((n) => typeof n === "number" && Number.isFinite(n)),
      );
    return ok ? (s as Scene) : null;
  } catch {
    return null;
  }
}

export function saveScene(scene: Scene, storage: Storage | undefined = globalThis.localStorage): boolean {
  try {
    storage!.setItem(KEY, JSON.stringify(scene));
    return true;
  } catch {
    return false;
  }
}
