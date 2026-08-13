import { Manrope, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";

const display = Space_Grotesk({
  variable: "--cubemap-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  variable: "--cubemap-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    absolute: "Cubemap — Equirect 360 to cube faces",
    template: "%s · Cubemap",
  },
  description:
    "Convert equirectangular 360 MP4 video or a ZIP of still frames into cubemap face images entirely on-device. Choose FPS, FOV, faces, and output folder — nothing uploads.",
};

export default function CubemapRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`cubemap ${display.variable} ${sans.variable}`}>
      {children}
    </div>
  );
}
