import type { Metadata } from "next";
import { DronesLanding } from "@/components/drones/DronesLanding";

export const metadata: Metadata = {
  title: {
    absolute: "Spleckt — Drone Services",
  },
};

export default function DronesHomePage() {
  return <DronesLanding />;
}
