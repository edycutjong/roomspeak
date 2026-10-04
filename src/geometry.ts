import type { Spot } from "./scene";

// Which ring a tap belongs to: the one whose center is nearest, among rings the tap falls inside.
// fx/fy are fractions of the photo; width/height its rendered size; minPx the smallest ring diameter drawn.
export function nearestRing(spots: Spot[], fx: number, fy: number, width: number, height: number, minPx = 64): Spot | null {
  let best: Spot | null = null;
  let bestDist = Infinity;
  for (const s of spots) {
    const dist = Math.hypot((fx - s.x) * width, (fy - s.y) * height);
    const radius = Math.max(minPx / 2, s.r * width);
    if (dist <= radius && dist < bestDist) {
      best = s;
      bestDist = dist;
    }
  }
  return best;
}
