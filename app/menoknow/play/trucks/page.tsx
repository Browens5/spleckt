import type { Metadata } from "next";
import Link from "next/link";
import { MenoknowBrand } from "@/components/menoknow/MenoknowBrand";

export const metadata: Metadata = {
  title: "Monster Trucks",
};

export default function MenoknowTrucksPage() {
  return (
    <div className="mk-shell mk-play">
      <header className="mk-header">
        <div className="mk-header__inner">
          <MenoknowBrand />
          <nav className="mk-nav" aria-label="Primary">
            <Link href="/play">All zones</Link>
            <Link href="/" className="mk-btn mk-btn--ghost">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mk-coming mk-coming--trucks">
        <p className="mk-coming__eyebrow">Play zone</p>
        <h1>Monster Trucks</h1>
        <p className="mk-coming__lede">
          Rev up letter practice — listen, match cases, and nail starting
          sounds on the dirt track.
        </p>

        <div className="mk-farm-games">
          <Link href="/play/trucks/letters" className="mk-farm-game mk-truck-game-card">
            <span className="mk-farm-game__art mk-truck-game-card__art" aria-hidden />
            <span className="mk-farm-game__copy">
              <span className="mk-farm-game__title">Letter Rally</span>
              <span className="mk-farm-game__blurb">
                Pick the right letter to jump, trick, and race to the finish.
              </span>
              <span className="mk-farm-game__cta">Let&apos;s race</span>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
