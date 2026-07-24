"use client";

import { motion } from "framer-motion";

type CowSpriteProps = {
  counted?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  label?: string;
  tabIndex?: number;
  index?: number;
  celebrate?: boolean;
};

export function CowSprite({
  counted = false,
  size = "md",
  onClick,
  label = "Cow",
  tabIndex,
  index = 0,
  celebrate = false,
}: CowSpriteProps) {
  return (
    <motion.button
      type="button"
      className={`mk-cow mk-cow--${size}${counted ? " is-counted" : ""}${onClick ? " mk-cow--tap" : " mk-cow--static"}`}
      onClick={onClick}
      aria-label={label}
      tabIndex={onClick ? tabIndex : -1}
      disabled={!onClick}
      initial={{ opacity: 0, y: 18, scale: 0.7 }}
      animate={
        celebrate
          ? { opacity: 1, y: [0, -10, 0], scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }
          : counted
            ? { opacity: 1, y: 0, scale: 1.06, rotate: 0 }
            : { opacity: 1, y: 0, scale: 1, rotate: 0 }
      }
      transition={{
        delay: Math.min(index * 0.04, 0.45),
        type: "spring",
        stiffness: 420,
        damping: 18,
      }}
      whileTap={onClick ? { scale: 0.9 } : undefined}
      whileHover={onClick ? { y: -3 } : undefined}
    >
      <span className="mk-cow__body" aria-hidden>
        <span className="mk-cow__spot" />
        <span className="mk-cow__spot mk-cow__spot--2" />
      </span>
      <span className="mk-cow__head" aria-hidden>
        <span className="mk-cow__ear mk-cow__ear--l" />
        <span className="mk-cow__ear mk-cow__ear--r" />
        <span className="mk-cow__snout" />
      </span>
      {counted ? <span className="mk-cow__check" aria-hidden /> : null}
    </motion.button>
  );
}
