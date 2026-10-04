import { useRef, useState } from "react";

type Props = { onHold: () => void; onShortPress?: () => void; label: string; ms?: number };

// Press and hold for `ms` to trigger — a stray tap never fires it, it only explains itself.
export function HoldButton({ onHold, onShortPress, label, ms = 2000 }: Props) {
  const timer = useRef<number | undefined>(undefined);
  const [holding, setHolding] = useState(false);

  const start = () => {
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setHolding(false);
      onHold();
    }, ms);
  };
  const stop = (released: boolean) => {
    if (timer.current === undefined) return;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
    if (released) onShortPress?.();
  };

  return (
    <button
      className={`hold${holding ? " is-holding" : ""}`}
      style={{ ["--hold-ms" as string]: `${ms}ms` }}
      aria-label={label}
      onPointerDown={start}
      onPointerUp={() => stop(true)}
      onPointerLeave={() => stop(false)}
      onPointerCancel={() => stop(false)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !e.repeat && timer.current === undefined && start()}
      onKeyUp={(e) => (e.key === "Enter" || e.key === " ") && stop(true)}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="hold-exit"
    >
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle className="hold__track" cx="20" cy="20" r="17" />
        <circle className="hold__fill" cx="20" cy="20" r="17" pathLength="100" />
        <g className="hold__gear">
          <circle cx="20" cy="20" r="3.6" />
          <path d="M20 10.5v2.6M20 26.9v2.6M29.5 20h-2.6M13.1 20h-2.6M26.7 13.3l-1.8 1.8M15.1 24.9l-1.8 1.8M26.7 26.7l-1.8-1.8M15.1 15.1l-1.8-1.8" />
          <circle cx="20" cy="20" r="6.8" />
        </g>
      </svg>
    </button>
  );
}
