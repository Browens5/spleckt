import { Orbitron, Rajdhani } from "next/font/google";
import type { Metadata } from "next";

const display = Orbitron({
  variable: "--portfolio-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Rajdhani({
  variable: "--portfolio-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    absolute: "Portfolio — Interactive project deck",
    template: "%s · Portfolio",
  },
  description:
    "A PlayCanvas carousel of interactive project cards. Sign in to add images, titles, and descriptions.",
};

export default function PortfolioRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`portfolio ${display.variable} ${sans.variable}`}>
      {children}
    </div>
  );
}
