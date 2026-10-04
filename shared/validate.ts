// Checks Gemini's answer before it reaches the app. Malformed items are dropped, never repaired.
export type Box = [number, number, number, number]; // ymin, xmin, ymax, xmax in 0–1000
export type DetectedSpot = { label: string; phrase: string; box: Box };

export const MAX_AI_SPOTS = 8;

export function validateSpots(raw: unknown): DetectedSpot[] {
  if (!Array.isArray(raw)) return [];
  const out: DetectedSpot[] = [];
  for (const item of raw) {
    if (out.length >= MAX_AI_SPOTS) break;
    if (!item || typeof item !== "object") continue;
    const { label, phrase, box_2d } = item as Record<string, unknown>;
    if (typeof phrase !== "string" || !phrase.trim()) continue;
    if (!Array.isArray(box_2d) || box_2d.length !== 4) continue;
    if (!box_2d.every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000)) continue;
    const [ymin, xmin, ymax, xmax] = box_2d as number[];
    if (ymin >= ymax || xmin >= xmax) continue;
    out.push({
      label: typeof label === "string" && label.trim() ? label.trim() : phrase.trim(),
      phrase: phrase.trim(),
      box: [ymin, xmin, ymax, xmax],
    });
  }
  return out;
}
