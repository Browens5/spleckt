"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function PortfolioLoginPage() {
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
        callbackURL: "/",
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to sign in");
        return;
      }

      const session = await authClient.getSession();
      if (!session.data?.user) {
        setError(
          "Signed in, but no session cookie was stored. Stay on portfolio.spleckt.com and try again.",
        );
        return;
      }

      router.replace("/");
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
    <div className="portfolio-auth">
      <div className="portfolio-auth__card">
        <p className="portfolio-auth__kicker">BRIAN OWENS</p>
        <h1>Sign in to edit</h1>
        <p>
          Editors and admins can add photos, videos, and descriptions to the
          PlayCanvas project deck.
        </p>
        <form className="portfolio-editor__form" onSubmit={onSubmit}>
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
          {error ? <p className="portfolio-editor__error">{error}</p> : null}
          <button className="portfolio-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Enter editor"}
          </button>
        </form>
        <p className="portfolio-auth__footer">
          <Link href="/">Back to the deck</Link>
        </p>
      </div>
    </div>
  );
}
