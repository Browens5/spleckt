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
    "Convert equirectangular or YouTube 360 EAC video into cubemap face images. Projection runs in the browser; optional YouTube import fetches via the host.",
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
