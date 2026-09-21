import { Link } from "@tanstack/react-router";

export function Brand({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-3" aria-label="HECH Corporation SARL — Accueil">
      <span className="grid size-10 shrink-0 place-items-center bg-primary text-sm font-black text-primary-foreground shadow-sm transition-transform group-hover:-translate-y-0.5">
        HC
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={`block font-display text-lg font-extrabold ${inverted ? "text-primary-foreground" : "text-foreground"}`}>HECH</span>
          <span className={`mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] ${inverted ? "text-primary-foreground/65" : "text-muted-foreground"}`}>Corporation SARL</span>
        </span>
      )}
    </Link>
  );
}