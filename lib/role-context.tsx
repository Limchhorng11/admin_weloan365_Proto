"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ROLES, USERS, type Role } from "./data";

const ROLE_STORAGE_KEY = "weloan_role";

/** Persist the role chosen on the sign-in screen (prototype auth). */
export function setActiveRole(key: string) {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, key);
  } catch {
    /* ignore (SSR / storage disabled) */
  }
}

type RoleContextValue = {
  role: Role;
  user: (typeof USERS)[number];
  /** Check if the current role has a permission. */
  can: (permission: string) => boolean;
  /** Check if the current role can approve a loan of `amount`. */
  canApprove: (amount: number) => boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

/** Pick a representative staff member to show as the "logged-in user" for each role. */
export const ROLE_TO_USER: Record<string, string> = {
  admin:            "Kosal M.",
  senior_officer:   "Sophea K.",
  credit_officer:   "Laybun N.",
  customer_service: "Pisey C.",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  // The active role is chosen on the sign-in screen and stored locally.
  const [roleKey, setRoleKey] = useState<string>("admin");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved && ROLES.some(r => r.key === saved)) setRoleKey(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<RoleContextValue>(() => {
    const role = ROLES.find(r => r.key === roleKey) ?? ROLES[0];
    const userName = ROLE_TO_USER[role.key];
    const user = USERS.find(u => u.name === userName) ?? USERS[0];

    const can = (permission: string) =>
      role.permissions === "*" || role.permissions.includes(permission);

    const canApprove = (amount: number) => {
      if (!can("loan.approve")) return false;
      if (role.approvalLimit === null) return true; // unlimited
      if (role.approvalLimit === 0) return false;   // cannot approve
      return amount <= role.approvalLimit;
    };

    return { role, user, can, canApprove };
  }, [roleKey]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export function useCan(permission: string) {
  return useRole().can(permission);
}
