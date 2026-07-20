export type UserRole = "viewer" | "editor" | "admin";

export const USER_ROLES: UserRole[] = ["viewer", "editor", "admin"];

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role?: UserRole | string | null;
};

export function normalizeRole(role?: string | null): UserRole {
  if (role === "admin" || role === "editor" || role === "viewer") {
    return role;
  }
  // Legacy "client" accounts become viewers.
  return "viewer";
}
