import { Suspense } from "react";
import { GamesExperience } from "@/components/games/GamesExperience";

export default function GamesPage() {
  return (
    <Suspense fallback={<div className="games-canvas-fallback" aria-hidden />}>
      <GamesExperience />
    </Suspense>
  );
}
