import { useRef, useState } from "react";

type Props = { onHold: () => void; label: string; ms?: number };

// Press and hold for `ms` to trigger — a stray tap never fires it.
export function HoldButton({ onHold, label, ms = 2000 }: Props) {
  const timer = useRef<number | undefined>(undefined);
  const [holding, setHolding] = useState(false);

  const start = () => {
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      onHold();
    }, ms);
  };
  const stop = () => {
    window.clearTimeout(timer.current);
    setHolding(false);
  };

  return (
    <button
      className={`hold${holding ? " is-holding" : ""}`}
      style={{ ["--hold-ms" as string]: `${ms}ms` }}
      aria-label={label}
      title={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="hold-exit"
    >
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="hold__track" cx="18" cy="18" r="15" />
        <circle className="hold__fill" cx="18" cy="18" r="15" pathLength="100" />
        <path d="M14 13h8M14 18h8M14 23h8" />
      </svg>
    </button>
  );
}
