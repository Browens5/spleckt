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
    absolute: "Brian Owens — Portfolio",
    template: "%s · Brian Owens",
  },
  description:
    "VDC & Field Solutions Engineer. AI, autonomy, and 3D capture for the jobsite.",
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
