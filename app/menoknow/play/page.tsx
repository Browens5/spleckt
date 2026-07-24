import type { Metadata } from "next";
import Link from "next/link";
import { MenoknowBrand } from "@/components/menoknow/MenoknowBrand";

export const metadata: Metadata = {
  title: "Play zones",
};

const zones = [
  {
    href: "/play/trucks",
    title: "Monster Trucks",
    blurb: "Letter smashers and loud counting.",
    accent: "trucks",
  },
  {
    href: "/play/build",
    title: "Construction",
    blurb: "Dig, stack, and build number skills.",
    accent: "build",
  },
  {
    href: "/play/farm",
    title: "Cow Farm",
    blurb: "Gentle matching and moo-time games.",
    accent: "farm",
  },
] as const;

export default function MenoknowPlayHubPage() {
  return (
    <div className="mk-shell mk-play">
      <header className="mk-header">
        <div className="mk-header__inner">
          <MenoknowBrand />
          <nav className="mk-nav" aria-label="Primary">
            <Link href="/">Home</Link>
          </nav>
        </div>
      </header>

      <main className="mk-play__main">
        <h1>Play zones</h1>
        <p>Pick a world. More games are on the way.</p>
        <div className="mk-zones" role="list">
          {zones.map((zone) => (
            <div key={zone.href} role="listitem">
              <Link href={zone.href} className={`mk-zone mk-zone--${zone.accent}`}>
                <span className="mk-zone__art" aria-hidden />
                <span className="mk-zone__copy">
                  <span className="mk-zone__title">{zone.title}</span>
                  <span className="mk-zone__blurb">{zone.blurb}</span>
                  <span className="mk-zone__cta">Open zone</span>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
