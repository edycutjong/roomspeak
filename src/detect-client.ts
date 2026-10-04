import type { Lang } from "../shared/prompt";
import type { DetectedSpot } from "../shared/validate";

export class DetectError extends Error {}

export async function detectSpots(base64: string, lang: Lang): Promise<DetectedSpot[]> {
  let res: Response;
  try {
    res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, lang }),
      signal: AbortSignal.timeout(70_000),
    });
  } catch {
    throw new DetectError("network");
  }
  if (!res.ok) throw new DetectError(`status ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.spots) ? data.spots : [];
}
