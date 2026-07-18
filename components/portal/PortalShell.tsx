"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const nav = [
  { href: "/portal", label: "Library" },
  { href: "/portal/upload", label: "Upload" },
  { href: "/portal/media", label: "Marketing media", adminOnly: true },
];

export function PortalShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user.role === "admin";

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="portal">
      <aside className="portal__sidebar">
        <Link href="/" className="brand-mark brand-mark--compact">
          <span className="brand-mark__glyph" aria-hidden />
          <span className="brand-mark__name">Spleckt</span>
        </Link>

        <nav className="portal__nav">
          {nav
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "is-active" : undefined}
              >
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="portal__user">
          <div>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
            {isAdmin ? <span className="pill">Admin</span> : null}
          </div>
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="portal__main">{children}</main>
    </div>
  );
}
