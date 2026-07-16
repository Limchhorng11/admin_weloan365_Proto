"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type NotifKind = "info" | "warn" | "success";

export type Notif = {
  id: number;
  title: string;
  meta: string;
  kind: NotifKind;
  read: boolean;
  /** Only visible to this user (by name). Omit to show to everyone. */
  forUser?: string;
  /** Where clicking the notification should navigate. */
  href?: string;
};

const STORAGE_KEY = "weloan_notifications";

const SEED: Notif[] = [
  { id: 6, title: "New consultation request from Sokha Chan", meta: "Just now",   kind: "info",    read: false, href: "/customer/consultations?open=RC-221" },
  { id: 1, title: "New application APP-10298 from Bopha Sok", meta: "2 min ago",  kind: "info",    read: false, href: "/customer/applications/APP-10298" },
  // LN-55008 is the loan account disbursed from APP-10295 — deep-links to its repayment tab.
  { id: 2, title: "Payment overdue on LN-55008",               meta: "1 hour ago", kind: "warn",    read: false, href: "/customer/applications/APP-10295?tab=repayment" },
  { id: 3, title: "KYC verified for C-0425",                   meta: "Yesterday",  kind: "success", read: false, href: "/customer/accounts/C-0425" },
  { id: 4, title: "Disbursement completed — APP-10295",        meta: "2 days ago", kind: "success", read: true,  href: "/customer/applications/APP-10295" },
  { id: 5, title: "Monthly portfolio report ready",             meta: "3 days ago", kind: "info",    read: true  },
];

let nextId = 1000;

type Ctx = {
  notifications: Notif[];
  addNotification: (n: Omit<Notif, "id" | "read">) => void;
  markAllRead: (forUser: string | null) => void;
  markRead: (id: number) => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

// Persisted to localStorage so notifications survive the sign-in-as-a-role
// switch on the login screen, which unmounts this provider.
function load(): Notif[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Notif[];
    nextId = Math.max(nextId, ...parsed.map(n => n.id + 1));
    return parsed;
  } catch {
    return SEED;
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notif[]>(SEED);
  // Gates the save effect until after hydration runs, so it doesn't fire
  // first (with the stale SEED state) and clobber what's in storage.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNotifications(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      /* ignore (storage disabled) */
    }
  }, [notifications, hydrated]);

  const addNotification = (n: Omit<Notif, "id" | "read">) =>
    setNotifications(prev => [{ ...n, id: nextId++, read: false }, ...prev]);

  const markAllRead = (forUser: string | null) =>
    setNotifications(prev =>
      prev.map(n => (!n.forUser || n.forUser === forUser ? { ...n, read: true } : n))
    );

  const markRead = (id: number) =>
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAllRead, markRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
