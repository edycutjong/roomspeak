import { useEffect, useState } from "react";
import { CORE_WORDS, COPY } from "../copy";
import type { Scene } from "../scene";
import { useSpeaker } from "../speech";
import { HoldButton } from "./HoldButton";
import { PhotoStage } from "./PhotoStage";

type Props = { scene: Scene; showHandoff: boolean; onHandoffSeen: () => void; onExit: () => void };

export function SpeakScreen({ scene, showHandoff, onHandoffSeen, onExit }: Props) {
  const t = COPY[scene.lang];
  const { speak, activeKey, hasVoice } = useSpeaker(scene.lang);
  const [caption, setCaption] = useState<string | null>(null);
  const [holdHint, setHoldHint] = useState(false);

  // Without a matching device voice, the phrase is shown in large text instead.
  useEffect(() => {
    if (hasVoice || !caption) return;
    const id = setTimeout(() => setCaption(null), 5000);
    return () => clearTimeout(id);
  }, [caption, hasVoice]);

  useEffect(() => {
    if (!holdHint) return;
    const id = setTimeout(() => setHoldHint(false), 2600);
    return () => clearTimeout(id);
  }, [holdHint]);

  function say(key: string, phrase: string) {
    speak(key, phrase);
    if (!hasVoice) setCaption(phrase);
  }

  return (
    <main className="speak">
      <img className="speak__backdrop" src={scene.photo} alt="" aria-hidden="true" />
      <PhotoStage
        className="speak__stage"
        photo={scene.photo}
        aspect={scene.aspect}
        spots={scene.spots}
        activeId={activeKey}
        onActivate={(s) => say(s.id, s.phrase)}
      />
      <nav className="core" aria-label={t.coreLabel}>
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
      <HoldButton onHold={onExit} onShortPress={() => setHoldHint(true)} label={t.holdToEdit} />
      {holdHint && (
        <div className="hold-hint" role="status">
          {t.holdToEdit}
        </div>
      )}
      {caption && !hasVoice && (
        <div className="caption" role="status" data-testid="caption">
          {caption}
        </div>
      )}
      {showHandoff && (
        <div className="handoff" role="dialog" aria-modal="true" aria-labelledby="handoff-title">
          <div className="handoff__card">
            <h2 id="handoff-title">{t.handoffTitle}</h2>
            <p>{t.handoffBody}</p>
            <p className="handoff__way-back">{t.handoffWayBack}</p>
            <button className="btn btn--primary" onClick={onHandoffSeen} autoFocus>
              {t.handoffOk}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
