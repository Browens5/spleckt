"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function HandoffLoginPage() {
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
        callbackURL: "/center",
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to sign in");
        return;
      }

      const session = await authClient.getSession();
      if (!session.data?.user) {
        setError(
          "Signed in, but no session cookie was stored. Stay on handoff.spleckt.com and try again.",
        );
        return;
      }

      router.replace("/center");
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
    <div className="handoff-auth">
      <div className="handoff-auth__card">
        <Link href="/" className="handoff-brand handoff-brand--compact">
          <span className="handoff-brand__mark" aria-hidden />
          <span className="handoff-brand__name">Handoff</span>
        </Link>
        <h1>Training center</h1>
        <p>
          Sign in with your Handoff account, or use the same credentials you
          already have from your shared workspace.
        </p>

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
          <button className="btn btn--primary handoff-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="handoff-auth__footer">
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
