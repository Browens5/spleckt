"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  categoryLabels,
  portfolioItems,
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
      <header className="dr-page__hero">
        <p className="dr-kicker">Portfolio</p>
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
            <motion.article
              layout
              key={item.slug}
              className={`dr-card dr-card--${item.category}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="dr-card__visual" aria-hidden>
                <span className="dr-card__scan" />
              </div>
              <div className="dr-card__meta">
                <p className="dr-kicker">{categoryLabels[item.category]}</p>
                <h2>{item.title}</h2>
                <p className="dr-card__place">{item.location}</p>
                <p>{item.summary}</p>
                <p className="dr-card__deliverable">{item.deliverable}</p>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
