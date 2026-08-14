"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DronesBrand } from "@/components/drones/DronesBrand";
import { DRONES_EMAIL } from "@/lib/drones/content";

const nav = [
  { href: "/", label: "Mission" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/contact", label: "Contact" },
];

function publicPath(pathname: string) {
  if (pathname === "/drones" || pathname.startsWith("/drones/")) {
    return pathname.replace(/^\/drones/, "") || "/";
  }
  return pathname;
}

export function DronesShell({ children }: { children: React.ReactNode }) {
  const pathname = publicPath(usePathname());
  const [open, setOpen] = useState(false);

  return (
    <div className="dr-shell">
      <header className="dr-header">
        <div className="dr-header__inner">
          <DronesBrand compact />
          <button
            type="button"
            className="dr-nav-toggle"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
          <nav className={`dr-nav${open ? " is-open" : ""}`}>
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "is-active" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              className="dr-btn dr-btn--primary"
              onClick={() => setOpen(false)}
            >
              Book a flight
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="dr-footer">
        <div className="dr-footer__brand">
          <DronesBrand compact />
          <p>Aerial capture for marketing, mapping, and the record.</p>
        </div>
        <div className="dr-footer__links">
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/contact">Contact</Link>
          <a href={`mailto:${DRONES_EMAIL}`}>{DRONES_EMAIL}</a>
        </div>
      </footer>
    </div>
  );
}
