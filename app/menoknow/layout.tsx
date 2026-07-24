import { Fredoka, Nunito } from "next/font/google";
import type { Metadata } from "next";

const display = Fredoka({
  variable: "--menoknow-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Nunito({
  variable: "--menoknow-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    absolute: "MenoKnow — Play. Learn. Grow.",
    template: "%s · MenoKnow",
  },
  description:
    "MenoKnow is a playful learning game center for little kids — letters, numbers, and simple activities with trucks, construction, and farm themes.",
};

export default function MenoknowRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`menoknow ${display.variable} ${sans.variable}`}>
      {children}
    </div>
  );
}
