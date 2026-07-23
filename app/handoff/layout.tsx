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
    absolute: "Handoff — Training Center",
    template: "%s · Handoff",
  },
  description:
    "Handoff training modules, certification tests, and credentials for tools, software, and techniques.",
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
