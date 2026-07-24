import { Syne, Figtree } from "next/font/google";
import type { Metadata } from "next";

const display = Syne({
  variable: "--handoff-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sans = Figtree({
  variable: "--handoff-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    absolute: "Handoff — Relay training for clean knowledge passes",
    template: "%s · Handoff",
  },
  description:
    "Handoff is relay training for teams: learn a skill, prove it, and pass information cleanly to the next person.",
};

export default function HandoffRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`handoff ${display.variable} ${sans.variable}`}>{children}</div>
  );
}
