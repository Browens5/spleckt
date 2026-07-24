import type { Metadata } from "next";
import { MenoknowLanding } from "@/components/menoknow/MenoknowLanding";

export const metadata: Metadata = {
  title: {
    absolute: "MenoKnow — Play big. Learn fast.",
  },
};

export default function MenoknowHomePage() {
  return <MenoknowLanding />;
}
