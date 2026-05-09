"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ROLES, USERS, type Role } from "./data";

type RoleContextValue = {
  role: Role;
  user: (typeof USERS)[number];
  setRoleKey: (key: string) => void;
  /** Check if the current role has a permission. */
  can: (permission: string) => boolean;
  /** Check if the current role can approve a loan of `amount`. */
  canApprove: (amount: number) => boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

/** Pick a representative staff member to show as the "logged-in user" for each role. */
const ROLE_TO_USER: Record<string, string> = {
  admin:          "Kosal M.",
  branch_manager: "Ratanak L.",
  senior_co:      "Sophea K.",
  co:             "Laybun N.",
  approval:       "Mengsrun H.",
  cashier:        "Pisey C.",
  compliance:     "Sreyneang P.",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roleKey, setRoleKey] = useState<string>("admin");

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

    return { role, user, setRoleKey, can, canApprove };
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
