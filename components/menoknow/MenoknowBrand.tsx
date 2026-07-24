import Link from "next/link";

export function MenoknowBrand({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`mk-brand${compact ? " mk-brand--compact" : ""}`}
    >
      <span className="mk-brand__mark" aria-hidden>
        <span className="mk-brand__wheel mk-brand__wheel--left" />
        <span className="mk-brand__cabin" />
        <span className="mk-brand__wheel mk-brand__wheel--right" />
      </span>
      <span className="mk-brand__name">MenoKnow</span>
    </Link>
  );
}
