import { useState } from "react";
import type { Copy } from "../copy";
import type { Spot } from "../scene";

type Props = {
  spots: Spot[];
  t: Copy;
  activeId: string | null;
  onHear: (s: Spot) => void;
  onEdit: (id: string, phrase: string) => void;
  onRemove: (id: string) => void;
};

export function SpotList({ spots, t, activeId, onHear, onEdit, onRemove }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function commit(id: string) {
    if (draft.trim()) onEdit(id, draft.trim());
    setEditing(null);
  }

  return (
    <ol className="spots" data-testid="spot-list">
      {spots.map((s) => (
        <li key={s.id} className={`spot${s.id === activeId ? " is-speaking" : ""}`} data-testid="spot-row">
          {editing === s.id ? (
            <form
              className="spot__edit"
              onSubmit={(e) => {
                e.preventDefault();
                commit(s.id);
              }}
            >
              <input
                autoFocus
                value={draft}
                maxLength={60}
                aria-label={t.edit}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
              />
              <button className="chip chip--accent" type="submit">{t.save}</button>
            </form>
          ) : (
            <div className="spot__text">
              {s.label !== s.phrase && <span className="spot__label">{s.label}</span>}
              <span className="spot__phrase">“{s.phrase}”</span>
            </div>
          )}
          {editing !== s.id && (
            <div className="spot__actions">
              <button className="chip" onClick={() => onHear(s)}>{t.hear}</button>
              <button
                className="chip"
                onClick={() => {
                  setDraft(s.phrase);
                  setEditing(s.id);
                }}
              >
                {t.edit}
              </button>
              <button className="chip chip--danger" onClick={() => onRemove(s.id)}>{t.remove}</button>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
