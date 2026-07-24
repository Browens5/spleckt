"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const nav = [
  { href: "/center", label: "Modules" },
  { href: "/center/certifications", label: "Certifications" },
];

function publicPath(pathname: string) {
  return pathname.replace(/^\/handoff/, "") || "/";
}

export function HandoffShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  const pathname = publicPath(usePathname());
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="handoff-center">
      <aside className="handoff-center__sidebar">
        <Link href="/" className="handoff-brand handoff-brand--compact">
          <span className="handoff-brand__mark" aria-hidden />
          <span className="handoff-brand__name">Handoff</span>
        </Link>

        <nav className="handoff-center__nav">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "is-active" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="handoff-center__user">
          <div>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
          </div>
          <button type="button" className="btn btn--ghost handoff-btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="handoff-center__main">{children}</main>
    </div>
  );
}
