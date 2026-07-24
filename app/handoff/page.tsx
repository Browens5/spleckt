import type { Metadata } from "next";
import { HandoffLanding } from "@/components/handoff/HandoffLanding";

export const metadata: Metadata = {
  title: {
    absolute: "Handoff — Pass the knowledge. Keep the team moving.",
  },
};

export default function HandoffHomePage() {
  return <HandoffLanding />;
}
