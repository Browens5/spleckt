"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
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

    const result = await authClient.signUp.email({ name, email, password });
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Unable to create account");
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="brand-mark brand-mark--compact">
          <span className="brand-mark__glyph" aria-hidden />
          <span className="brand-mark__name">Spleckt</span>
        </Link>
        <h1>Create account</h1>
        <p>Set up portal access for your Spleckt library.</p>

        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" required autoComplete="name" />
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
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: "1.25rem" }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
