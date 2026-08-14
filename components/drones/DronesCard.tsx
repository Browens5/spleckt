"use client";

import { DronesPhoto } from "@/components/drones/DronesPhoto";
import { categoryLabels, type PortfolioItem } from "@/lib/drones/content";

export function DronesCard({
  item,
  heading = "h3",
  compact = false,
}: {
  item: PortfolioItem;
  heading?: "h2" | "h3";
  compact?: boolean;
}) {
  const Title = heading;
  return (
    <article className="dr-card">
      <div className="dr-card__visual">
        <DronesPhoto
          src={item.image}
          alt={item.title}
          sizes="(max-width: 900px) 100vw, 50vw"
        />
        <span className="dr-card__shade" />
      </div>
      <div className="dr-card__meta">
        <p className="dr-kicker">{categoryLabels[item.category]}</p>
        <Title>{item.title}</Title>
        <p className="dr-card__place">{item.location}</p>
        {compact ? null : (
          <>
            <p className="dr-card__summary">{item.summary}</p>
            <p className="dr-card__deliverable">{item.deliverable}</p>
          </>
        )}
      </div>
    </article>
  );
}
