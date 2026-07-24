import Link from "next/link";

export function HandoffBrand({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`handoff-brand${compact ? " handoff-brand--compact" : ""}`}
    >
      <span className="handoff-brand__mark" aria-hidden>
        <span className="handoff-brand__baton" />
        <span className="handoff-brand__lane" />
      </span>
      <span className="handoff-brand__name">Handoff</span>
    </Link>
  );
}
