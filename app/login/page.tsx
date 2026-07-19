"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/portal",
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to sign in");
        return;
      }

      // Confirm the session cookie is readable on this host before navigating.
      const session = await authClient.getSession();
      if (!session.data?.user) {
        setError(
          "Signed in, but no session cookie was stored. Make sure you stay on www.spleckt.com.",
        );
        return;
      }

      router.replace("/portal");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Check that the database is configured.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="brand-mark brand-mark--compact">
          <span className="brand-mark__glyph" aria-hidden />
          <span className="brand-mark__name">Spleckt</span>
        </Link>
        <h1>Client portal</h1>
        <p>Sign in to view, share, and manage your lifelike 3D captures.</p>

        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: "1.25rem" }}>
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
