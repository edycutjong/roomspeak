import type { ChangeEvent } from "react";
import type { Lang } from "../../shared/prompt";
import { COPY } from "../copy";
import type { Scene } from "../scene";
import { PhotoStage } from "./PhotoStage";

export type SetupStatus = "idle" | "looking" | "ready";

type Props = {
  lang: Lang;
  scene: Scene | null;
  status: SetupStatus;
  onLang: (lang: Lang) => void;
  onPhoto: (file: File) => void;
  onDone: () => void;
};

export function SetupScreen({ lang, scene, status, onLang, onPhoto, onDone }: Props) {
  const t = COPY[lang];

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPhoto(file);
  }

  return (
    <main className="setup">
      <header className="setup__head">
        <h1 className="brand">Room to Speak</h1>
        <div className="lang" role="group" aria-label="Language">
          {(["id", "en"] as const).map((l) => (
            <button key={l} className={l === lang ? "is-on" : ""} onClick={() => onLang(l)} disabled={status === "looking"}>
              {l === "id" ? "Bahasa Indonesia" : "English"}
            </button>
          ))}
        </div>
      </header>

      {!scene && <p className="setup__welcome">{t.welcome}</p>}

      {scene && (
        <section className="setup__photo">
          <PhotoStage photo={scene.photo} aspect={scene.aspect} spots={scene.spots} numbered reveal />
          {status === "looking" && (
            <div className="looking" role="status">
              <span className="looking__dot" /> {t.looking}
            </div>
          )}
        </section>
      )}

      <label className={`btn ${scene ? "btn--quiet" : "btn--primary"}`}>
        {t.pickPhoto}
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} hidden data-testid="photo-input" />
      </label>
      {!scene && <p className="note">{t.photoNote}</p>}

      {scene && status === "ready" && (
        <>
          <h2 className="setup__h2">{t.spotsTitle}</h2>
          <ol className="spots" data-testid="spot-list">
            {scene.spots.map((s) => (
              <li key={s.id} className="spot">
                <span className="spot__label">{s.label}</span>
                <span className="spot__phrase">“{s.phrase}”</span>
              </li>
            ))}
          </ol>
          <button className="btn btn--primary btn--done" onClick={onDone}>
            {t.done}
          </button>
        </>
      )}
    </main>
  );
}
