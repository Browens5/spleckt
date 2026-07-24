"use client";

import { motion } from "framer-motion";

export type TruckPose = "idle" | "drive" | "jump" | "trick" | "stall";

export function MonsterTruckSprite({
  pose = "idle",
  compact = false,
}: {
  pose?: TruckPose;
  compact?: boolean;
}) {
  const jumping = pose === "jump" || pose === "trick";
  const spinning = pose === "trick";
  const shaking = pose === "stall";

  return (
    <motion.div
      className={`mk-truck-sprite${compact ? " mk-truck-sprite--compact" : ""}`}
      animate={
        spinning
          ? { y: [-4, -48, -8, 0], rotate: [0, -20, 360, 0], scale: [1, 1.08, 1] }
          : jumping
            ? { y: [-2, -42, 0], rotate: [0, -12, 6, 0] }
            : shaking
              ? { x: [0, -6, 6, -4, 0], rotate: [0, -3, 3, 0] }
              : pose === "drive"
                ? { y: [0, -3, 0], rotate: [0, -1.5, 0] }
                : { y: [0, -2, 0] }
      }
      transition={
        spinning || jumping
          ? { duration: 0.85, ease: "easeOut" }
          : shaking
            ? { duration: 0.45 }
            : { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
      }
      aria-hidden
    >
      <span className="mk-truck-sprite__body" />
      <span className="mk-truck-sprite__cab" />
      <span className="mk-truck-sprite__scoop" />
      <span className="mk-truck-sprite__wheel mk-truck-sprite__wheel--front" />
      <span className="mk-truck-sprite__wheel mk-truck-sprite__wheel--rear" />
      <span className="mk-truck-sprite__flame" />
    </motion.div>
  );
}
