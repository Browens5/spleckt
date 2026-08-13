"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/#showcase", label: "Showcase" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.55);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header site-header--overlay${scrolled ? " is-solid" : ""}`}
    >
      <div className="site-header__inner">
        <Link href="/" className="brand-mark" onClick={() => setOpen(false)}>
          <span className="brand-mark__glyph" aria-hidden />
          <span className="brand-mark__name">Spleckt</span>
        </Link>

        <nav className={`site-nav ${open ? "is-open" : ""}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="btn btn--ghost"
            onClick={() => setOpen(false)}
          >
            Client login
          </Link>
          <Link
            href="/#contact"
            className="btn btn--primary"
            onClick={() => setOpen(false)}
          >
            Start a capture
          </Link>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
