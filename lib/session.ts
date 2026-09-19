import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { normalizeRole, type UserRole } from "@/lib/types";

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

export function getRole(role?: string | null): UserRole {
  return normalizeRole(role);
}

export function isAdmin(role?: string | null) {
  return getRole(role) === "admin";
}

export function isEditor(role?: string | null) {
  const normalized = getRole(role);
  return normalized === "editor" || normalized === "admin";
}

/** Upload new splats / edit existing ones. */
export function canEditSplats(role?: string | null) {
  return isEditor(role);
}

export function canManageUsers(role?: string | null) {
  return isAdmin(role);
}

export function canManageMarketing(role?: string | null) {
  return isAdmin(role);
}

/** Edit portfolio cards, images, and profile copy. */
export function canManagePortfolio(role?: string | null) {
  return isEditor(role);
}
