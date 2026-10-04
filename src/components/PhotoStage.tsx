import { useRef, type CSSProperties, type PointerEvent } from "react";
import { nearestRing } from "../geometry";
import type { Spot } from "../scene";

type Props = {
  photo: string;
  aspect: number;
  spots: Spot[];
  activeId?: string | null;
  selectedId?: string | null;
  onActivate?: (spot: Spot) => void; // a ring was tapped (or chosen with the keyboard)
  onPoint?: (fx: number, fy: number) => void; // add-spot mode: where on the photo, as fractions
  minRing?: number; // smallest drawn ring diameter in px, also the smallest hit area
  numbered?: boolean;
  reveal?: boolean;
  className?: string;
};

type Press = { id: number; hit: string | null; cancelled: boolean };

// The photo kept at its own aspect ratio, so ring positions are plain percentages of it.
// A tap counts on release, inside the same ring it started in; a second finger cancels it,
// so a resting palm or a slide across the photo never speaks.
export function PhotoStage({
  photo, aspect, spots, activeId, selectedId, onActivate, onPoint, minRing = 64, numbered = false, reveal = false, className = "",
}: Props) {
  const press = useRef<Press | null>(null);
  const interactive = !!(onActivate || onPoint);

  function locate(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    return { fx, fy, hit: nearestRing(spots, fx, fy, rect.width, rect.height, minRing) };
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    if (press.current) {
      press.current.cancelled = true;
      return;
    }
    press.current = { id: e.pointerId, hit: locate(e).hit?.id ?? null, cancelled: false };
  }

  function up(e: PointerEvent<HTMLDivElement>) {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    press.current = null;
    if (p.cancelled) return;
    const { fx, fy, hit } = locate(e);
    if (onPoint) onPoint(fx, fy);
    else if (hit && hit.id === p.hit) onActivate?.(hit);
  }

  const speaking = !!activeId && spots.some((s) => s.id === activeId);

  return (
    <div className={`stage-wrap ${className}`} style={{ "--aspect": aspect } as CSSProperties}>
      <div
        className={`stage${speaking ? " is-speaking" : ""}`}
        style={{ "--ring-min": `${minRing}px` } as CSSProperties}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={() => (press.current = null)}
        data-testid="stage"
      >
        <img src={photo} alt="" draggable={false} />
        {spots.map((s, i) => {
          const cls = `ring${reveal ? " ring--reveal" : ""}${s.id === activeId ? " ring--active" : ""}${s.id === selectedId ? " ring--selected" : ""}`;
          const style = {
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            "--d": `${s.r * 200}%`,
            animationDelay: s.source === "ai" ? `${i * 110}ms` : "0ms",
          } as CSSProperties;
          if (s.id === "pending") return <span key={s.id} className={`${cls} ring--pending`} style={style} aria-hidden="true" />;
          return (
            <button
              key={s.id}
              type="button"
              className={cls}
              style={style}
              aria-label={s.phrase}
              tabIndex={onActivate ? 0 : -1}
              data-testid="ring"
              data-phrase={s.phrase}
              // Pointer taps are handled by the stage (overlap rule); this only fires for keyboard activation.
              onClick={(e) => e.detail === 0 && onActivate?.(s)}
            >
              {numbered && <span className="ring__num">{i + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
