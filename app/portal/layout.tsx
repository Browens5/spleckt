import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSession } from "@/lib/session";
import { normalizeRole } from "@/lib/types";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <PortalShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: normalizeRole(session.user.role),
      }}
    >
      {children}
    </PortalShell>
  );
}
