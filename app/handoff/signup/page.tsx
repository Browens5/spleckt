"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { HandoffBrand } from "@/components/handoff/HandoffBrand";
import { authClient } from "@/lib/auth-client";

export default function HandoffSignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/center",
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to create account");
        return;
      }

      const session = await authClient.getSession();
      if (!session.data?.user) {
        setError(
          "Account created, but no session cookie was stored. Try signing in on handoff.spleckt.com.",
        );
        return;
      }

      router.replace("/center");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Account creation failed. Check that the database is configured.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="handoff-auth">
      <div className="handoff-auth__card">
        <HandoffBrand compact />
        <h1>Join the relay</h1>
        <p>
          Create your Handoff account and start training for a clean pass to the
          next teammate.
        </p>

        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" type="text" required autoComplete="name" />
          </label>
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
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn--primary handoff-btn" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="handoff-auth__footer">
          Already on the team? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
