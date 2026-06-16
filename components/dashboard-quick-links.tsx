"use client";

import Link from "next/link";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

type QuickLink = { href: string; label: string; value: string };

/**
 * Dashboard quick-link cards. The "Review pending applications" card is gated
 * by loan.view, so roles without it (e.g. Customer Service) don't see — or get
 * a shortcut into — the loan applications section. The grid column count tracks
 * the number of visible cards so the row stays evenly filled (no empty slot).
 */
export function DashboardQuickLinks() {
  const { can } = useRole();

  const links: QuickLink[] = [];
  if (can("loan.view")) {
    links.push({
      href: "/customer/applications",
      label: "Review pending applications",
      value: "47 awaiting review →",
    });
  }
  links.push({
    href: "/customer/consultations",
    label: "Open consultations",
    value: "3 new requests →",
  });
  links.push({
    href: "/chat",
    label: "Customer chat",
    value: "3 unread →",
  });

  // Match columns to the number of cards so the block fills the row evenly.
  const cols = links.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className={cn("grid grid-cols-1 gap-4", cols)}>
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-card transition"
        >
          <div className="text-[13px] text-gray-500">{l.label}</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">{l.value}</div>
        </Link>
      ))}
    </div>
  );
}
