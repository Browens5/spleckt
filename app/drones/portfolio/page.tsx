import type { Metadata } from "next";
import { DronesPortfolio } from "@/components/drones/DronesPortfolio";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Selected Spleckt drone missions: marketing film, photogrammetry, orthomosaics, stockpile volumes, progress documentation, and virtual tours.",
};

export default function DronesPortfolioPage() {
  return <DronesPortfolio />;
}
