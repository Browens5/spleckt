"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { DronesCard } from "@/components/drones/DronesCard";
import { DronesPhoto } from "@/components/drones/DronesPhoto";
import {
  categoryLabels,
  portfolioItems,
  siteImages,
  type ServiceId,
} from "@/lib/drones/content";

const filters: Array<{ id: "all" | ServiceId; label: string }> = [
  { id: "all", label: "All missions" },
  { id: "marketing", label: categoryLabels.marketing },
  { id: "photogrammetry", label: categoryLabels.photogrammetry },
  { id: "orthomosaic", label: categoryLabels.orthomosaic },
  { id: "stockpile", label: categoryLabels.stockpile },
  { id: "progress", label: categoryLabels.progress },
  { id: "tours", label: categoryLabels.tours },
];

export function DronesPortfolio() {
  const [filter, setFilter] = useState<"all" | ServiceId>("all");
  const items = useMemo(
    () =>
      filter === "all"
        ? portfolioItems
        : portfolioItems.filter((item) => item.category === filter),
    [filter],
  );

  return (
    <section className="dr-page">
      <div className="dr-page__banner">
        <DronesPhoto src={siteImages.atmosphere} alt="" preload sizes="100vw" />
        <div className="dr-page__banner-grade" />
        <header className="dr-page__hero">
          <p className="dr-kicker dr-kicker--light">Portfolio</p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Missions from altitude.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Representative capture work across marketing, mapping, measurement,
            progress, and tours. Filter by discipline — every card is a flight
            with a deliverable.
          </motion.p>
        </header>
      </div>

      <div className="dr-page__body">
        <div className="dr-filters" role="tablist" aria-label="Portfolio filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={filter === item.id ? "is-active" : undefined}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <motion.div className="dr-portfolio" layout>
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                layout
                key={item.slug}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <DronesCard item={item} heading="h2" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
