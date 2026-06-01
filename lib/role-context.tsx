"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ROLES, USERS, type Role } from "./data";

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
const ROLE_TO_USER: Record<string, string> = {
  admin:            "Kosal M.",
  senior_officer:   "Sophea K.",
  credit_officer:   "Laybun N.",
  customer_service: "Pisey C.",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const value = useMemo<RoleContextValue>(() => {
    const role = ROLES.find(r => r.key === "admin") ?? ROLES[0];
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
  }, []);

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
