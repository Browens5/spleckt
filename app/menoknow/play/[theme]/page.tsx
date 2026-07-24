import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MenoknowBrand } from "@/components/menoknow/MenoknowBrand";

const themes = {
  trucks: {
    title: "Monster Trucks",
    accent: "trucks",
    promise: "Letter ramps, smash-and-say sounds, and big truck counting.",
  },
  build: {
    title: "Construction",
    accent: "build",
    promise: "Number digs, shape stacking, and hard-hat helpers.",
  },
  farm: {
    title: "Cow Farm",
    accent: "farm",
    promise: "Moo matching, gentle counting, and barn-yard letter finds.",
  },
} as const;

type ThemeSlug = keyof typeof themes;

export function generateStaticParams() {
  return Object.keys(themes).map((theme) => ({ theme }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ theme: string }>;
}): Promise<Metadata> {
  const { theme } = await params;
  const data = themes[theme as ThemeSlug];
  if (!data) return { title: "Play zone" };
  return { title: data.title };
}

export default async function MenoknowThemePage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;
  const data = themes[theme as ThemeSlug];
  if (!data) notFound();

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

      <main className={`mk-coming mk-coming--${data.accent}`}>
        <p className="mk-coming__eyebrow">Play zone</p>
        <h1>{data.title}</h1>
        <p className="mk-coming__lede">{data.promise}</p>
        <p className="mk-coming__status">Games for this zone are coming next.</p>
        <div className="mk-coming__actions">
          <Link href="/play" className="mk-btn mk-btn--primary mk-btn--lg">
            Back to play zones
          </Link>
        </div>
      </main>
    </div>
  );
}
