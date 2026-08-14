import Link from "next/link";

export function DronesBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`dr-brand${compact ? " dr-brand--compact" : ""}`}
      aria-label="Spleckt Drone Services home"
    >
      <span className="dr-brand__mark" aria-hidden>
        <svg viewBox="0 0 48 48" fill="none">
          <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="38" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="38" r="6.2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="38" cy="38" r="6.2" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M16 12.2h16M16 35.8h16M12.2 16v16M35.8 16v16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <rect x="18.5" y="18.5" width="11" height="11" rx="2.2" fill="var(--dr-accent)" />
          <circle cx="24" cy="24" r="2.1" fill="#fff" />
        </svg>
      </span>
      <span className="dr-brand__copy">
        <span className="dr-brand__name">Spleckt</span>
        <span className="dr-brand__tag">Drone Services</span>
      </span>
    </Link>
  );
}
