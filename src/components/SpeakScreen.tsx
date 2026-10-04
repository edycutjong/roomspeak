import { useEffect, useState } from "react";
import { CORE_WORDS, COPY } from "../copy";
import { nearestRing } from "../geometry";
import type { Scene } from "../scene";
import { useSpeaker } from "../speech";
import { HoldButton } from "./HoldButton";
import { PhotoStage } from "./PhotoStage";

type Props = { scene: Scene; onExit: () => void };

export function SpeakScreen({ scene, onExit }: Props) {
  const { speak, activeKey, hasVoice } = useSpeaker(scene.lang);
  const [caption, setCaption] = useState<string | null>(null);

  // Without a matching device voice, the phrase is shown in large text instead.
  useEffect(() => {
    if (hasVoice || !caption) return;
    const t = setTimeout(() => setCaption(null), 3000);
    return () => clearTimeout(t);
  }, [caption, hasVoice]);

  function say(key: string, phrase: string) {
    speak(key, phrase);
    if (!hasVoice) setCaption(phrase);
  }

  return (
    <main className="speak">
      <PhotoStage
        className="speak__stage"
        photo={scene.photo}
        aspect={scene.aspect}
        spots={scene.spots}
        activeId={activeKey}
        onTap={(fx, fy, w, h) => {
          const hit = nearestRing(scene.spots, fx, fy, w, h);
          if (hit) say(hit.id, hit.phrase);
        }}
      />
      <nav className="core" aria-label="Core words">
        {CORE_WORDS[scene.lang].map((w) => (
          <button
            key={w.label}
            className={`core__btn${activeKey === `core:${w.label}` ? " is-active" : ""}`}
            onClick={() => say(`core:${w.label}`, w.phrase)}
          >
            {w.label}
          </button>
        ))}
      </nav>
      <HoldButton onHold={onExit} label={COPY[scene.lang].holdToEdit} />
      {caption && !hasVoice && (
        <div className="caption" role="status" data-testid="caption">
          {caption}
        </div>
      )}
    </main>
  );
}
