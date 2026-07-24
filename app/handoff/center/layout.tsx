import { redirect } from "next/navigation";
import { HandoffShell } from "@/components/handoff/HandoffShell";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { getSession } from "@/lib/session";

export default async function HandoffCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureSchema();
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <HandoffShell
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    >
      {children}
    </HandoffShell>
  );
}
