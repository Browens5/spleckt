export type UserRole = "admin" | "client";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role?: UserRole | string | null;
};
