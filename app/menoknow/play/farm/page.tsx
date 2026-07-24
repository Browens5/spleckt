import type { Metadata } from "next";
import Link from "next/link";
import { MenoknowBrand } from "@/components/menoknow/MenoknowBrand";

export const metadata: Metadata = {
  title: "Cow Farm",
};

export default function MenoknowFarmPage() {
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

      <main className="mk-coming mk-coming--farm">
        <p className="mk-coming__eyebrow">Play zone</p>
        <h1>Cow Farm</h1>
        <p className="mk-coming__lede">
          Moo-time number practice — count herds from zero to one hundred.
        </p>

        <div className="mk-farm-games">
          <Link href="/play/farm/count" className="mk-farm-game">
            <span className="mk-farm-game__art" aria-hidden />
            <span className="mk-farm-game__copy">
              <span className="mk-farm-game__title">Count the cows</span>
              <span className="mk-farm-game__blurb">
                Tap cows, count out loud, and learn numbers 0–100 with pens of
                ten.
              </span>
              <span className="mk-farm-game__cta">Let&apos;s count</span>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
