import type { Metadata } from "next";
import { CowCountGame } from "@/components/menoknow/CowCountGame";

export const metadata: Metadata = {
  title: "Count the cows",
};

export default function MenoknowCowCountPage() {
  return <CowCountGame />;
}
