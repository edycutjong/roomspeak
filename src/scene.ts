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

// Nudges AI rings apart so overlapping ones stay reachable; never moves a ring more than `maxShift`.
// Works in photo-width units (y is scaled by the aspect so distances are true on screen).
export function separateSpots(spots: Spot[], aspect: number, minGap = 0.09, maxShift = 0.05): Spot[] {
  const out = spots.map((s) => ({ ...s }));
  const clampTo = (v: number, o: number) => Math.min(o + maxShift, Math.max(o - maxShift, Math.min(0.97, Math.max(0.03, v))));
  for (let iter = 0; iter < 24; iter++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i], b = out[j];
        const dx = b.x - a.x;
        const dy = (b.y - a.y) / aspect;
        const d = Math.hypot(dx, dy);
        if (d >= minGap) continue;
        const [ux, uy] = d > 1e-6 ? [dx / d, dy / d] : [1, 0];
        const push = (minGap - d) / 2;
        a.x = clampTo(a.x - ux * push, spots[i].x);
        a.y = clampTo(a.y - uy * push * aspect, spots[i].y);
        b.x = clampTo(b.x + ux * push, spots[j].x);
        b.y = clampTo(b.y + uy * push * aspect, spots[j].y);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return out;
}

const KEY = "roomspeak.scene.v1";
const HANDOFF_KEY = "roomspeak.handoff.seen";

export function handoffSeen(): boolean {
  try {
    return localStorage.getItem(HANDOFF_KEY) === "1";
  } catch {
    return false;
  }
}

export function markHandoffSeen(): void {
  try {
    localStorage.setItem(HANDOFF_KEY, "1");
  } catch {
    // shown again next time; harmless
  }
}

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
