import { Barlow_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";
import { DronesShell } from "@/components/drones/DronesShell";

const display = Barlow_Condensed({
  variable: "--drones-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Plus_Jakarta_Sans({
  variable: "--drones-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    absolute: "Spleckt — Drone Services",
    template: "%s · Spleckt Drone Services",
  },
  description:
    "Spleckt Drone Services: marketing photo and videography, photogrammetry, 2D and 3D orthomosaics, stockpile measurements, site progress documentation, and virtual tours.",
};

export default function DronesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`drones ${display.variable} ${sans.variable}`}>
      <DronesShell>{children}</DronesShell>
    </div>
  );
}
