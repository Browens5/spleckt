"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PortalRoleProvider, usePortalRole } from "@/components/portal/PortalRoleContext";
import { authClient } from "@/lib/auth-client";
import { normalizeRole } from "@/lib/types";

const nav = [
  { href: "/portal", label: "Library" },
  { href: "/portal/upload", label: "Upload", editorOnly: true },
  { href: "/portal/users", label: "Users", adminOnly: true },
  { href: "/portal/media", label: "Marketing media", adminOnly: true },
];

function PortalChrome({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, canEdit, isAdmin } = usePortalRole();

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
            .filter((item) => {
              if (item.adminOnly) return isAdmin;
              if (item.editorOnly) return canEdit;
              return true;
            })
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
            <span className="pill">{role}</span>
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

export function PortalShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role?: string | null };
}) {
  return (
    <PortalRoleProvider role={normalizeRole(user.role)}>
      <PortalChrome user={user}>{children}</PortalChrome>
    </PortalRoleProvider>
  );
}
