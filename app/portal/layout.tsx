import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSession } from "@/lib/session";

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
        role: session.user.role,
      }}
    >
      {children}
    </PortalShell>
  );
}
