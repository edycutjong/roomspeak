import { useState } from "react";
import type { Copy } from "../copy";
import type { Spot } from "../scene";

type Props = {
  spots: Spot[];
  t: Copy;
  activeId: string | null;
  selectedId: string | null;
  onSelect: (s: Spot) => void; // tapping a row hears it and opens its actions
  onEdit: (id: string, phrase: string) => void;
  onRemove: (id: string) => void;
};

export function SpotList({ spots, t, activeId, selectedId, onSelect, onEdit, onRemove }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function commit(id: string) {
    if (draft.trim()) onEdit(id, draft.trim());
    setEditing(null);
  }

  return (
    <ol className="spots" data-testid="spot-list">
      {spots.map((s, i) => {
        const open = s.id === selectedId;
        return (
          <li
            key={s.id}
            className={`spot${open ? " is-open" : ""}${s.id === activeId ? " is-speaking" : ""}`}
            data-testid="spot-row"
          >
            <span className="spot__num" aria-hidden="true">{i + 1}</span>
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
              <button className="spot__main" onClick={() => onSelect(s)} aria-label={`${t.hear}: ${s.phrase}`} aria-expanded={open}>
                {s.label !== s.phrase && <span className="spot__label">{s.label}</span>}
                <span className="spot__phrase">“{s.phrase}”</span>
                <svg className="spot__speaker" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                  <path className="spot__wave" d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a7.8 7.8 0 0 1 0 11" />
                </svg>
              </button>
            )}
            {open && editing !== s.id && (
              <div className="spot__actions">
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
        );
      })}
    </ol>
  );
}
