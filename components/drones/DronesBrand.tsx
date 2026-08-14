import Link from "next/link";

export function DronesBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`dr-brand${compact ? " dr-brand--compact" : ""}`}
      aria-label="Spleckt Drone Services home"
    >
      <span className="dr-brand__mark" aria-hidden>
        <span className="dr-brand__rotor dr-brand__rotor--nw" />
        <span className="dr-brand__rotor dr-brand__rotor--ne" />
        <span className="dr-brand__rotor dr-brand__rotor--sw" />
        <span className="dr-brand__rotor dr-brand__rotor--se" />
        <span className="dr-brand__body" />
      </span>
      <span className="dr-brand__copy">
        <span className="dr-brand__name">Spleckt</span>
        <span className="dr-brand__tag">Drone Services</span>
      </span>
    </Link>
  );
}
