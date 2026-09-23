import { Righteous, Quicksand } from "next/font/google";
import type { Metadata } from "next";

const display = Righteous({
  variable: "--games-display",
  subsets: ["latin"],
  weight: "400",
});

const sans = Quicksand({
  variable: "--games-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    absolute: "Spleckt Games — Multiplayer Board Game Lounge",
    template: "%s · Spleckt Games",
  },
  description:
    "A groovy isometric board game studio. Sign in at the front desk, take a table, and play checkers, Scum, Battleship, or Connect 4 with friends — or a computer.",
};

export default function GamesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`games ${display.variable} ${sans.variable}`}>{children}</div>
  );
}
