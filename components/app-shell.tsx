"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { RoleProvider } from "@/lib/role-context";
import { NotificationsProvider } from "@/lib/notifications";

// Routes that should render as a fullscreen page (no sidebar / topbar).
const PUBLIC_PREFIXES = ["/login", "/forgot-password", "/reset-password"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Mobile nav drawer state — lifted here so the Topbar hamburger and the
  // Sidebar drawer share it. Always closed on desktop (drawer is CSS-hidden).
  const [navOpen, setNavOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => setNavOpen(false), [pathname]);

  if (isPublic(pathname)) {
    return <>{children}</>;
  }

  return (
    <RoleProvider>
      <NotificationsProvider>
        <div className="flex min-h-screen">
          <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar onMenuClick={() => setNavOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
          </div>
        </div>
      </NotificationsProvider>
    </RoleProvider>
  );
}
