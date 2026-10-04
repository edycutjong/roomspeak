import { useState, type ChangeEvent } from "react";
import type { Lang } from "../../shared/prompt";
import { COPY } from "../copy";
import { nearestRing } from "../geometry";
import { DEFAULT_R, MAX_SPOTS, newId, type Scene, type Spot } from "../scene";
import { useSpeaker } from "../speech";
import { PhotoStage } from "./PhotoStage";
import { SpotList } from "./SpotList";

export type SetupStatus = "idle" | "looking" | "ready";

type Props = {
  lang: Lang;
  scene: Scene | null;
  status: SetupStatus;
  onLang: (lang: Lang) => void;
  onPhoto: (file: File) => void;
  onSpots: (spots: Spot[]) => void;
  onDone: () => void;
};

export function SetupScreen({ lang, scene, status, onLang, onPhoto, onSpots, onDone }: Props) {
  const t = COPY[lang];
  const { speak, activeKey } = useSpeaker(lang);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState("");
  const spots = scene?.spots ?? [];
  const full = spots.length >= MAX_SPOTS;

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPhoto(file);
  }

  function handleTap(fx: number, fy: number, w: number, h: number) {
    if (adding) {
      setPending({ x: fx, y: fy });
      return;
    }
    const hit = nearestRing(spots, fx, fy, w, h, 44);
    if (hit) speak(hit.id, hit.phrase);
  }

  function savePending() {
    if (!pending || !draft.trim() || full) return;
    const phrase = draft.trim();
    onSpots([...spots, { id: newId(), label: phrase, phrase, x: pending.x, y: pending.y, r: DEFAULT_R, source: "manual" }]);
    cancelAdd();
  }

  function cancelAdd() {
    setAdding(false);
    setPending(null);
    setDraft("");
  }

  const shown: Spot[] = pending
    ? [...spots, { id: "pending", label: "", phrase: "", x: pending.x, y: pending.y, r: DEFAULT_R, source: "manual" }]
    : spots;

  return (
    <main className="setup">
      <header className="setup__head">
        <h1 className="brand">Room to Speak</h1>
        <div className="lang" role="group" aria-label="Language" title={scene ? t.langLocked : undefined}>
          {(["id", "en"] as const).map((l) => (
            <button key={l} className={l === lang ? "is-on" : ""} onClick={() => onLang(l)} disabled={!!scene}>
              {l === "id" ? "Bahasa Indonesia" : "English"}
            </button>
          ))}
        </div>
      </header>

      {!scene && <p className="setup__welcome">{t.welcome}</p>}

      {scene && (
        <section className={`setup__photo${adding ? " is-adding" : ""}`}>
          <PhotoStage
            photo={scene.photo}
            aspect={scene.aspect}
            spots={shown}
            activeId={activeKey}
            onTap={status === "ready" ? handleTap : undefined}
            numbered
            reveal
          />
          {status === "looking" && (
            <div className="looking" role="status">
              <span className="looking__dot" /> {t.looking}
            </div>
          )}
          {adding && !pending && <div className="hint">{t.addHint}</div>}
        </section>
      )}

      {pending && (
        <form
          className="add-form"
          onSubmit={(e) => {
            e.preventDefault();
            savePending();
          }}
        >
          <input
            autoFocus
            value={draft}
            maxLength={60}
            placeholder={t.phrasePlaceholder}
            onChange={(e) => setDraft(e.target.value)}
            data-testid="add-phrase"
          />
          <div className="add-form__row">
            <button type="button" className="btn btn--quiet" onClick={cancelAdd}>{t.cancel}</button>
            <button type="submit" className="btn btn--primary" disabled={!draft.trim()}>{t.save}</button>
          </div>
        </form>
      )}

      {!adding && (
        <label className={`btn ${scene ? "btn--quiet" : "btn--primary"}`}>
          {t.pickPhoto}
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} hidden data-testid="photo-input" />
        </label>
      )}
      {!scene && <p className="note">{t.photoNote}</p>}

      {scene && status === "ready" && (
        <>
          <div className="setup__listhead">
            <h2 className="setup__h2">{t.spotsTitle}</h2>
            {!adding && (
              <button className="chip chip--accent" onClick={() => setAdding(true)} disabled={full} data-testid="add-spot">
                + {t.addSpot}
              </button>
            )}
            {adding && !pending && (
              <button className="chip" onClick={cancelAdd}>{t.cancel}</button>
            )}
          </div>
          {full && <p className="note">{t.maxReached}</p>}
          <SpotList
            spots={spots}
            t={t}
            activeId={activeKey}
            onHear={(s) => speak(s.id, s.phrase)}
            onEdit={(id, phrase) => onSpots(spots.map((s) => (s.id === id ? { ...s, phrase } : s)))}
            onRemove={(id) => onSpots(spots.filter((s) => s.id !== id))}
          />
          <button className="btn btn--primary btn--done" onClick={onDone}>
            {t.done}
          </button>
        </>
      )}
    </main>
  );
}
