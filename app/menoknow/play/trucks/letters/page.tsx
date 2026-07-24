import type { Metadata } from "next";
import { MonsterTruckGame } from "@/components/menoknow/MonsterTruckGame";

export const metadata: Metadata = {
  title: "Letter Rally",
};

export default function MenoknowTruckLettersPage() {
  return <MonsterTruckGame />;
}
