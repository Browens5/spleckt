import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ensureSchema } from "@/lib/db/ensure-schema";

export async function getSession() {
  await ensureSchema();
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function isAdmin(role?: string | null) {
  return role === "admin";
}
