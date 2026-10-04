import { useEffect, useState, type ChangeEvent } from "react";
import type { Lang } from "../../shared/prompt";
import { COPY } from "../copy";
import { DEFAULT_R, MAX_SPOTS, newId, type Scene, type Spot } from "../scene";
import { useSpeaker } from "../speech";
import { PhotoStage } from "./PhotoStage";
import { SpotList } from "./SpotList";

export type SetupStatus = "idle" | "looking" | "ready" | "failed";

type Props = {
  lang: Lang;
  scene: Scene | null;
  status: SetupStatus;
  storageFailed: boolean;
  onLang: (lang: Lang) => void;
  onPhoto: (file: File) => void;
  onRetry: () => void;
  onSpots: (spots: Spot[]) => void;
  onDone: () => void;
};

function PhotoInput({ label, className, onFile }: { label: string; className: string; onFile: (f: File) => void }) {
  function handle(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onFile(file);
  }
  return (
    <label className={className}>
      {label}
      <input type="file" accept="image/*" capture="environment" onChange={handle} hidden data-testid="photo-input" />
    </label>
  );
}

export function SetupScreen({ lang, scene, status, storageFailed, onLang, onPhoto, onRetry, onSpots, onDone }: Props) {
  const t = COPY[lang];
  const { speak, activeKey, hasVoice } = useSpeaker(lang);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [removed, setRemoved] = useState<{ spot: Spot; index: number } | null>(null);
  const spots = scene?.spots ?? [];
  const full = spots.length >= MAX_SPOTS;
  const editable = status === "ready" || status === "failed";
  const empty = editable && spots.length === 0;

  useEffect(() => {
    if (!removed) return;
    const id = setTimeout(() => setRemoved(null), 6000);
    return () => clearTimeout(id);
  }, [removed]);

  function select(s: Spot) {
    setSelectedId(s.id);
    speak(s.id, s.phrase);
  }

  function savePending() {
    if (!pending || !draft.trim() || full) return;
    const phrase = draft.trim();
    const spot: Spot = { id: newId(), label: phrase, phrase, x: pending.x, y: pending.y, r: DEFAULT_R, source: "manual" };
    onSpots([...spots, spot]);
    setSelectedId(spot.id);
    cancelAdd();
  }

  function cancelAdd() {
    setAdding(false);
    setPending(null);
    setDraft("");
  }

  function remove(id: string) {
    const index = spots.findIndex((s) => s.id === id);
    if (index < 0) return;
    setRemoved({ spot: spots[index], index });
    setSelectedId(null);
    onSpots(spots.filter((s) => s.id !== id));
  }

  function undo() {
    if (!removed) return;
    const next = [...spots];
    next.splice(Math.min(removed.index, next.length), 0, removed.spot);
    onSpots(next);
    setRemoved(null);
  }

  const shown: Spot[] = pending
    ? [...spots, { id: "pending", label: "", phrase: "", x: pending.x, y: pending.y, r: DEFAULT_R, source: "manual" }]
    : spots;

  return (
    <main className={`setup${scene ? " has-scene" : ""}`}>
      <header className="setup__head">
        <h1 className="brand">
          <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="3" y="6" width="26" height="20" rx="5" />
            <circle cx="19.5" cy="15" r="4.5" />
            <circle cx="19.5" cy="15" r="1.4" />
          </svg>
          Room to Speak
        </h1>
        {!scene ? (
          <div className="lang" role="group" aria-label="Bahasa / Language">
            {(["id", "en"] as const).map((l) => (
              <button key={l} className={l === lang ? "is-on" : ""} aria-pressed={l === lang} onClick={() => onLang(l)}>
                {l === "id" ? "Bahasa Indonesia" : "English"}
              </button>
            ))}
          </div>
        ) : (
          status !== "looking" && !adding && (
            <button className="link-btn" onClick={() => setConfirmReplace(true)} data-testid="replace-photo">
              {t.replacePhoto}
            </button>
          )
        )}
      </header>

      {!scene && (
        <section className="intro">
          <p className="setup__welcome">{t.welcome}</p>
          <PhotoInput label={t.pickPhoto} className="btn btn--primary btn--wide" onFile={onPhoto} />
          <p className="note">{t.photoNote}</p>
        </section>
      )}

      {confirmReplace && scene && (
        <div className="notice" role="alertdialog" aria-label={t.replaceTitle}>
          <p>{t.replaceTitle}</p>
          <div className="pair">
            <button className="btn btn--quiet" onClick={() => setConfirmReplace(false)}>{t.cancel}</button>
            <PhotoInput
              label={t.replaceConfirm}
              className="btn btn--primary"
              onFile={(f) => {
                setConfirmReplace(false);
                setSelectedId(null);
                onPhoto(f);
              }}
            />
          </div>
        </div>
      )}

      {scene && (
        <section className={`setup__photo${adding ? " is-adding" : ""}`}>
          <PhotoStage
            photo={scene.photo}
            aspect={scene.aspect}
            spots={shown}
            activeId={activeKey}
            selectedId={selectedId}
            minRing={44}
            onActivate={editable && !adding ? select : undefined}
            onPoint={editable && adding ? (x, y) => setPending({ x, y }) : undefined}
            numbered
            reveal
          />
          {status === "looking" && (
            <div className="looking" role="status">
              <span className="looking__dot" /> {t.looking}
            </div>
          )}
          {adding && !pending && <div className="hint" role="status">{t.addHint}</div>}
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
            aria-label={t.phrasePlaceholder}
            onChange={(e) => setDraft(e.target.value)}
            data-testid="add-phrase"
          />
          <div className="pair">
            <button type="button" className="btn btn--quiet" onClick={cancelAdd}>{t.cancel}</button>
            <button type="submit" className="btn btn--primary" disabled={!draft.trim()}>{t.save}</button>
          </div>
        </form>
      )}

      {status === "failed" && (
        <div className="notice notice--warn" role="alert">
          <p>{t.failed}</p>
          <button className="btn btn--primary" onClick={onRetry}>{t.retry}</button>
        </div>
      )}
      {status === "ready" && spots.length === 0 && !pending && (
        <div className="notice" role="status">
          <p>{t.nothingFound}</p>
        </div>
      )}
      {scene && !hasVoice && <p className="note note--voice">{t.noVoice}</p>}

      {scene && editable && (
        <>
          <div className="setup__listhead">
            <h2 className="setup__h2">{t.spotsTitle}</h2>
            {!adding ? (
              <button className="chip chip--add" onClick={() => setAdding(true)} disabled={full} data-testid="add-spot">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
                {t.addSpot}
              </button>
            ) : (
              !pending && <button className="chip" onClick={cancelAdd}>{t.cancel}</button>
            )}
          </div>
          {full && <p className="note">{t.maxReached}</p>}
          <SpotList
            spots={spots}
            t={t}
            activeId={activeKey}
            selectedId={selectedId}
            onSelect={select}
            onEdit={(id, phrase) => onSpots(spots.map((s) => (s.id === id ? { ...s, phrase } : s)))}
            onRemove={remove}
          />
          {storageFailed && <p className="notice notice--warn" role="alert">{t.storageFailed}</p>}
          <div className="dock">
            {removed && (
              <div className="toast" role="status">
                <span>{t.removed}</span>
                <button className="link-btn" onClick={undo}>{t.undo}</button>
              </div>
            )}
            <button className={`btn btn--wide ${status === "failed" && empty ? "btn--quiet" : "btn--primary"}`} onClick={onDone}>
              {t.done}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
