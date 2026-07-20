"use client";

import { createContext, useContext } from "react";
import { normalizeRole, type UserRole } from "@/lib/types";

type PortalRoleContextValue = {
  role: UserRole;
  canEdit: boolean;
  isAdmin: boolean;
};

const PortalRoleContext = createContext<PortalRoleContextValue>({
  role: "viewer",
  canEdit: false,
  isAdmin: false,
});

export function PortalRoleProvider({
  role,
  children,
}: {
  role?: string | null;
  children: React.ReactNode;
}) {
  const normalized = normalizeRole(role);
  return (
    <PortalRoleContext.Provider
      value={{
        role: normalized,
        canEdit: normalized === "editor" || normalized === "admin",
        isAdmin: normalized === "admin",
      }}
    >
      {children}
    </PortalRoleContext.Provider>
  );
}

export function usePortalRole() {
  return useContext(PortalRoleContext);
}
