"use client";

import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { DronesPhoto } from "@/components/drones/DronesPhoto";
import { DRONES_EMAIL, services, siteImages } from "@/lib/drones/content";

type FormState = {
  name: string;
  email: string;
  company: string;
  service: string;
  message: string;
};

const empty: FormState = {
  name: "",
  email: "",
  company: "",
  service: "",
  message: "",
};

export function DronesContact() {
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Name, email, and a short note about the site are required.");
      return;
    }
    setError(null);

    const subject = encodeURIComponent(
      `Drone mission inquiry${form.company ? ` — ${form.company}` : ""}`,
    );
    const body = encodeURIComponent(
      [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        form.company ? `Company: ${form.company}` : null,
        form.service ? `Interest: ${form.service}` : null,
        "",
        form.message,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    window.location.href = `mailto:${DRONES_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section className="dr-page dr-page--contact">
      <div className="dr-page__banner">
        <DronesPhoto src={siteImages.drone} alt="" preload sizes="100vw" />
        <div className="dr-page__banner-grade" />
        <header className="dr-page__hero">
          <p className="dr-kicker dr-kicker--light">Contact</p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Tell us what to fly.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Share the site, the question, and the deliverable you need. We reply
            with a flight plan — not a generic brochure.
          </motion.p>
        </header>
      </div>

      <div className="dr-page__body dr-contact">
        <motion.aside
          className="dr-contact__aside"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          <p className="dr-kicker">Direct</p>
          <a className="dr-contact__email" href={`mailto:${DRONES_EMAIL}`}>
            {DRONES_EMAIL}
          </a>
          <p>
            Typical first-look turnaround is measured in days. Repeat mapping
            and progress flights lock headings so every visit compares cleanly.
          </p>
          <ul>
            <li>Marketing stills &amp; aerial film</li>
            <li>Photogrammetry &amp; orthomosaics</li>
            <li>Stockpile volumes</li>
            <li>Progress documentation</li>
            <li>Virtual tours</li>
          </ul>
        </motion.aside>

        <motion.form
          className="dr-form"
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
        >
          <label>
            Name
            <input
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              required
            />
          </label>
          <label>
            Company
            <input
              name="company"
              autoComplete="organization"
              value={form.company}
              onChange={(event) => update("company", event.target.value)}
            />
          </label>
          <label>
            What should we fly?
            <select
              name="service"
              value={form.service}
              onChange={(event) => update("service", event.target.value)}
            >
              <option value="">Select a discipline</option>
              {services.map((service) => (
                <option key={service.id} value={service.title}>
                  {service.title}
                </option>
              ))}
              <option value="Multiple / not sure">Multiple / not sure</option>
            </select>
          </label>
          <label className="dr-form__wide">
            Site &amp; notes
            <textarea
              name="message"
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              placeholder="Address or site name, acres, deadline, and what you need to show or measure."
              required
            />
          </label>
          {error ? <p className="dr-form__error">{error}</p> : null}
          {sent ? (
            <p className="dr-form__ok">
              Your mail client should open with the mission brief. If it
              doesn&apos;t, write us at {DRONES_EMAIL}.
            </p>
          ) : null}
          <button type="submit" className="dr-btn dr-btn--primary dr-btn--lg">
            Send mission brief
          </button>
        </motion.form>
      </div>
    </section>
  );
}
