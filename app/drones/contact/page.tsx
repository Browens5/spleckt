import type { Metadata } from "next";
import { DronesContact } from "@/components/drones/DronesContact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a Spleckt drone mission for marketing capture, mapping, stockpile measurement, progress documentation, or a virtual tour.",
};

export default function DronesContactPage() {
  return <DronesContact />;
}
