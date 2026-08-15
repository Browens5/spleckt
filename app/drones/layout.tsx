import { Chakra_Petch, IBM_Plex_Sans } from "next/font/google";
import type { Metadata } from "next";

const display = Chakra_Petch({
  variable: "--drones-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = IBM_Plex_Sans({
  variable: "--drones-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    absolute: "Spleckt Drones — Photo, Survey & Tours",
    template: "%s · Spleckt Drones",
  },
  description:
    "Quality drone services from Spleckt: cinema-grade aerials, construction progress, survey-grade maps, and virtual tours.",
};

export default function DronesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`drones ${display.variable} ${sans.variable}`}>{children}</div>
  );
}
