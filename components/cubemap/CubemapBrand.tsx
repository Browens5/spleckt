import Link from "next/link";

export function CubemapBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`cm-brand${compact ? " cm-brand--compact" : ""}`}
      aria-label="Cubemap home"
    >
      <span className="cm-brand__mark" aria-hidden>
        <span className="cm-brand__cube" />
      </span>
      <span className="cm-brand__name">Cubemap</span>
    </Link>
  );
}
