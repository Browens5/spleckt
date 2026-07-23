import type { Metadata } from "next";
import { HandoffLanding } from "@/components/handoff/HandoffLanding";

export const metadata: Metadata = {
  title: {
    absolute: "Handoff — Training Center",
  },
};

export default function HandoffHomePage() {
  return <HandoffLanding />;
}
