/** Flecha dibujada en trazo (no un carácter Unicode), para enlaces de acción. */
export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 12" width="18" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M0 6h18M13 1l5 5-5 5" />
    </svg>
  );
}

/** Signo menos/más dibujado para selectores de cantidad. */
export function StepIcon({ kind }: { kind: "minus" | "plus" }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={kind === "plus" ? "M8 2v12M2 8h12" : "M2 8h12"} />
    </svg>
  );
}
