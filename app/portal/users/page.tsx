"use client";

import { useEffect, useState } from "react";
import { usePortalRole } from "@/components/portal/PortalRoleContext";
import { USER_ROLES, type UserRole } from "@/lib/types";

type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string | Date | null;
};

export default function UsersAdminPage() {
  const { isAdmin } = usePortalRole();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    void (async () => {
      const res = await fetch("/api/users");
      if (cancelled) return;
      if (!res.ok) {
        setError("Admin access required to manage users.");
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="portal-page">
        <div className="media-empty">
          <p>Only admins can change user roles.</p>
        </div>
      </div>
    );
  }

  async function updateRole(userId: string, role: UserRole) {
    setSavingId(userId);
    setError(null);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingId(null);

    if (!res.ok) {
      setError(data.error ?? "Could not update role");
      return;
    }

    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, role } : user)),
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-page__header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Users & roles</h1>
          <p>
            New signups start as <strong>viewer</strong>. Promote people to{" "}
            <strong>editor</strong> so they can upload/edit, or to{" "}
            <strong>admin</strong> for full control.
          </p>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="users-table">
        <div className="users-table__head">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
        </div>
        {users.map((user) => (
          <div key={user.id} className="users-table__row">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <select
              value={user.role}
              disabled={savingId === user.id}
              onChange={(event) =>
                void updateRole(user.id, event.target.value as UserRole)
              }
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
