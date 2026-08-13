"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePortalRole } from "@/components/portal/PortalRoleContext";
import {
  DEFAULT_HOME_EXPERIENCE,
  parseHomeExperience,
  type HomeExperienceSettings,
} from "@/lib/home-experience";

function Field({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default function HomeExperienceAdminPage() {
  const { isAdmin } = usePortalRole();
  const [settings, setSettings] = useState<HomeExperienceSettings>(
    DEFAULT_HOME_EXPERIENCE,
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/home-experience");
      if (cancelled) return;
      if (!res.ok) {
        setError("Could not load home experience settings.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSettings(parseHomeExperience(data.settings));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="portal-page">
        <div className="media-empty">
          <p>Only admins can adjust the home experience.</p>
        </div>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/home-experience", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.status === 401) {
        throw new Error("Admin access required.");
      }
      if (!res.ok) throw new Error("Could not save settings.");
      const data = await res.json();
      setSettings(parseHomeExperience(data.settings));
      setStatus("Saved. Refresh the marketing home page to see the change.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const { center, scroll } = settings;

  return (
    <div className="portal-page">
      <div className="portal-page__header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Home experience</h1>
          <p>
            Animation and scroll orbit around world origin{" "}
            <code>0, 0, 0</code>. Offset the capture so the point you care
            about sits at that origin.
          </p>
        </div>
      </div>

      {loading ? <p>Loading settings…</p> : null}

      <form className="portal-form portal-form--wide" onSubmit={onSubmit}>
        <fieldset className="portal-form__fieldset">
          <legend>Animation center</legend>
          <p className="portal-form__hint">
            SuperSplat world coordinates of the pivot. Particles assemble
            around origin after this point is mapped to <code>0, 0, 0</code>.
          </p>
          <div className="portal-form__row">
            <Field
              label="Center X"
              value={center.x}
              onChange={(x) => setSettings({ ...settings, center: { ...center, x } })}
            />
            <Field
              label="Center Y"
              value={center.y}
              onChange={(y) => setSettings({ ...settings, center: { ...center, y } })}
            />
            <Field
              label="Center Z"
              value={center.z}
              onChange={(z) => setSettings({ ...settings, center: { ...center, z } })}
            />
          </div>
        </fieldset>

        <fieldset className="portal-form__fieldset">
          <legend>Scroll orbit</legend>
          <p className="portal-form__hint">
            Camera path around the origin as the visitor scrolls the hero.
          </p>
          <div className="portal-form__row">
            <Field
              label="Radius"
              value={scroll.radius}
              step={1}
              onChange={(radius) =>
                setSettings({ ...settings, scroll: { ...scroll, radius } })
              }
            />
            <Field
              label="Height"
              value={scroll.height}
              step={1}
              onChange={(height) =>
                setSettings({ ...settings, scroll: { ...scroll, height } })
              }
            />
            <Field
              label="Look height"
              value={scroll.lookHeight}
              step={0.5}
              onChange={(lookHeight) =>
                setSettings({ ...settings, scroll: { ...scroll, lookHeight } })
              }
            />
          </div>
          <div className="portal-form__row">
            <Field
              label="Yaw start (°)"
              value={scroll.yawStart}
              step={1}
              onChange={(yawStart) =>
                setSettings({ ...settings, scroll: { ...scroll, yawStart } })
              }
            />
            <Field
              label="Yaw end (°)"
              value={scroll.yawEnd}
              step={1}
              onChange={(yawEnd) =>
                setSettings({ ...settings, scroll: { ...scroll, yawEnd } })
              }
            />
            <Field
              label="FOV"
              value={scroll.fov}
              step={1}
              onChange={(fov) =>
                setSettings({ ...settings, scroll: { ...scroll, fov } })
              }
            />
          </div>
        </fieldset>

        <fieldset className="portal-form__fieldset">
          <legend>Particle assemble</legend>
          <Field
            label="Cloud radius"
            value={settings.assembleRadius}
            step={1}
            onChange={(assembleRadius) =>
              setSettings({ ...settings, assembleRadius })
            }
          />
        </fieldset>

        {error ? <p className="form-error">{error}</p> : null}
        {status ? <p className="form-status">{status}</p> : null}

        <div className="hero__actions">
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save home experience"}
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => setSettings(DEFAULT_HOME_EXPERIENCE)}
          >
            Reset defaults
          </button>
        </div>
      </form>
    </div>
  );
}
