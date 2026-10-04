import type { CSSProperties, PointerEvent } from "react";
import type { Spot } from "../scene";

type Props = {
  photo: string;
  aspect: number;
  spots: Spot[];
  activeId?: string | null;
  // Tap position as fractions of the photo, plus the rendered photo size in px.
  onTap?: (fx: number, fy: number, width: number, height: number) => void;
  className?: string;
  numbered?: boolean; // Setup shows the list number inside each ring
};

// The photo kept at its own aspect ratio, so ring positions are plain percentages of it.
export function PhotoStage({ photo, aspect, spots, activeId, onTap, className = "", numbered = false }: Props) {
  function handlePointer(e: PointerEvent<HTMLDivElement>) {
    if (!onTap) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onTap((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, rect.width, rect.height);
  }

  return (
    <div className={`stage-wrap ${className}`} style={{ "--aspect": aspect } as CSSProperties}>
      <div
        className="stage"
        onPointerDown={handlePointer}
        data-testid="stage"
      >
        <img src={photo} alt="" draggable={false} />
        {spots.map((s, i) => (
          <span
            key={s.id}
            className={`ring${s.id === activeId ? " ring--active" : ""}`}
            data-testid="ring"
            data-phrase={s.phrase}
            style={
              {
                left: `${s.x * 100}%`,
                top: `${s.y * 100}%`,
                "--d": `${s.r * 200}%`,
                animationDelay: `${i * 120}ms`,
              } as CSSProperties
            }
          >
            {numbered && <span className="ring__num">{i + 1}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
