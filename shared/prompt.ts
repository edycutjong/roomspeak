// Gemini instructions + strict answer format. Proven in the detection spike.
export type Lang = "id" | "en";

const LANG_NAME: Record<Lang, string> = { id: "Indonesian", en: "English" };

export function buildPrompt(lang: Lang): string {
  const name = LANG_NAME[lang];
  return `This is a photo of the room where an adult with aphasia after a stroke spends the day.
He understands everything but cannot find words. We are building a visual scene display:
tappable spots on real objects in this photo that speak a short first-person phrase for him.

Pick up to 8 objects he would most plausibly want to talk about for daily needs, comfort,
people, or activities (e.g. kettle/cup -> a drink, TV/radio -> turn it on, window -> fresh air,
bed/chair -> rest, family photo -> a person, medicine, fan/AC, door, phone).
Skip structural or trivial things: walls, floor, ceiling, ceiling lamps, outlets, cables, generic clutter.
Only include objects that are clearly visible; fewer good spots beats 8 weak ones.

For each object return:
- label: short object name in ${name}
- phrase: what HE says, first person, natural everyday spoken ${name} (casual, not formal), max 6 words
- box_2d: [ymin, xmin, ymax, xmax] normalized to 0-1000
- confidence: 0-1`;
}

// For OpenAI-compatible providers, which take a JSON object rather than Gemini's response schema.
export const JSON_OBJECT_SUFFIX = `

Return ONLY a JSON object: {"spots": [{"label": string, "phrase": string, "box_2d": [ymin, xmin, ymax, xmax], "confidence": number}]}.
Coordinates are integers normalized to 0-1000 relative to the image height (y) and width (x).`;

export const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      label: { type: "STRING" },
      phrase: { type: "STRING" },
      box_2d: { type: "ARRAY", items: { type: "INTEGER" } },
      confidence: { type: "NUMBER" },
    },
    required: ["label", "phrase", "box_2d"],
  },
} as const;
