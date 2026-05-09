"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  MessageCircle,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Check,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import { ROLES } from "@/lib/data";

type MenuKey = "notif" | "user" | "viewas" | null;

const TITLES: { match: string; title: string }[] = [
  { match: "/customer/accounts",      title: "Customers" },
  { match: "/customer/consultations", title: "Consultations" },
  { match: "/customer/applications",  title: "Loan Applications" },
  { match: "/customer/feedback",      title: "Feedback & Rate" },
  { match: "/customer/birthday",      title: "Birthday Notifications" },
  { match: "/loan-product",           title: "Loan Products" },
  { match: "/content/blogs",          title: "Blogs" },
  { match: "/content/announcements",  title: "Announcements" },
  { match: "/chat",                   title: "Chat" },
];

export function Topbar() {
  const pathname = usePathname();
  const active = TITLES.find(t => pathname === t.match || pathname.startsWith(t.match + "/"));
  const title = active?.title ?? "Dashboard";

  const { role, user, setRoleKey } = useRole();
  const [open, setOpen] = useState<MenuKey>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => setOpen(null), [pathname]);

  const toggle = (which: Exclude<MenuKey, null>) =>
    setOpen(prev => (prev === which ? null : which));

  const initials = user.name.split(" ").map(s => s[0]).join("");

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-gray-700">{title}</h1>

        {/* View-as pill */}
        <div ref={shellRef} className="hidden md:block">
          <div className="relative">
            <button
              onClick={() => toggle("viewas")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition",
                open === "viewas"
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              )}
              title="Switch role to preview the UI"
            >
              <Eye className="w-3 h-3" />
              <span>Viewing as: {role.name}</span>
              <ChevronDown
                className={cn("w-3 h-3 transition", open === "viewas" && "rotate-180")}
              />
            </button>
            {open === "viewas" && (
              <ViewAsMenu
                currentKey={role.key}
                onPick={k => {
                  setRoleKey(k);
                  setOpen(null);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => toggle("notif")}
            className={cn(
              "p-2 rounded-md relative text-gray-600",
              open === "notif" ? "bg-gray-100" : "hover:bg-gray-100"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {open === "notif" && <NotificationsMenu />}
        </div>

        {/* Chat */}
        <Link
          href="/chat"
          className="p-2 rounded-md hover:bg-gray-100 relative text-gray-600"
          aria-label="Chat"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            3
          </span>
        </Link>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        {/* User */}
        <div className="relative">
          <button
            onClick={() => toggle("user")}
            className={cn(
              "flex items-center gap-2 pl-1 pr-2 py-1 rounded-md",
              open === "user" ? "bg-gray-100" : "hover:bg-gray-50"
            )}
            aria-label="Account"
          >
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[13px] font-medium text-gray-900 leading-tight">{user.name}</div>
              <div className="text-[11px] text-gray-500 leading-tight">{role.name}</div>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition", open === "user" && "rotate-180")} />
          </button>
          {open === "user" && <UserMenu />}
        </div>
      </div>
    </header>
  );
}

/* ---------- dropdown shell ---------- */

function Dropdown({
  children,
  className,
  align = "right",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "right" | "left";
}) {
  return (
    <div
      className={cn(
        "absolute top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-30 overflow-hidden",
        align === "right" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------- View-as ---------- */

function ViewAsMenu({
  currentKey,
  onPick,
}: {
  currentKey: string;
  onPick: (key: string) => void;
}) {
  const fmtLimit = (n: number | null) =>
    n === null ? "Unlimited" : n === 0 ? "—" : "$" + n.toLocaleString();
  return (
    <Dropdown className="w-[300px]" align="left">
      <div className="px-4 py-2.5 border-b border-gray-200">
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
          Preview as role
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">
          Switches the UI to what this role sees and can do.
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto scrollbar-thin py-1">
        {ROLES.map(r => {
          const active = r.key === currentKey;
          return (
            <button
              key={r.key}
              onClick={() => onPick(r.key)}
              className={cn(
                "w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-2.5",
                active && "bg-brand-50/60"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  active ? "bg-brand-600" : "bg-gray-300"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-brand-700" : "text-gray-900"
                    )}
                  >
                    {r.name}
                  </span>
                  {active && <Check className="w-3.5 h-3.5 text-brand-600" />}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Approval limit{" "}
                  <span className="font-medium text-gray-700">{fmtLimit(r.approvalLimit)}</span> ·
                  {r.branchScope === "all" ? " all branches" : " own branch"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Dropdown>
  );
}

/* ---------- Notifications ---------- */

type NotifKind = "info" | "warn" | "success";
type Notif = { id: number; title: React.ReactNode; meta: string; kind: NotifKind; read: boolean };

const NOTIFS: Notif[] = [
  { id: 1, title: <>New application <b className="font-medium">APP-10298</b> from Bopha Sok</>, meta: "2 min ago",      kind: "info",    read: false },
  { id: 2, title: <>Payment overdue on <b className="font-medium">LN-55008</b></>,               meta: "1 hour ago",     kind: "warn",    read: false },
  { id: 3, title: <>KYC verified for <b className="font-medium">C-0425</b></>,                   meta: "Yesterday",      kind: "success", read: false },
  { id: 4, title: <>Disbursement completed — <b className="font-medium">APP-10295</b></>,        meta: "2 days ago",     kind: "success", read: true  },
  { id: 5, title: <>Monthly portfolio report ready</>,                                           meta: "3 days ago",     kind: "info",    read: true  },
];

function NotificationsMenu() {
  const iconFor = (k: NotifKind) => {
    const base = "w-4 h-4";
    if (k === "warn") return <AlertTriangle className={cn(base, "text-amber-600")} />;
    if (k === "success") return <CheckCircle2 className={cn(base, "text-emerald-600")} />;
    return <FileText className={cn(base, "text-brand-600")} />;
  };
  const bgFor = (k: NotifKind) =>
    k === "warn" ? "bg-amber-50" : k === "success" ? "bg-emerald-50" : "bg-brand-50";

  const unread = NOTIFS.filter(n => !n.read).length;

  return (
    <Dropdown className="w-[360px]">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sm text-gray-900">Notifications</div>
          {unread > 0 && (
            <span className="text-[11px] font-medium bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full">
              {unread} new
            </span>
          )}
        </div>
        <button className="text-xs text-brand-600 hover:underline font-medium">Mark all read</button>
      </div>

      <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
        {NOTIFS.map(n => (
          <button
            key={n.id}
            className="w-full text-left block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
          >
            <div className="flex gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
                  bgFor(n.kind)
                )}
              >
                {iconFor(n.kind)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 leading-snug">{n.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{n.meta}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />}
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-200 text-center">
        <button className="text-xs text-brand-600 hover:underline font-medium">
          View all notifications
        </button>
      </div>
    </Dropdown>
  );
}

/* ---------- User ---------- */

function UserMenu() {
  const { role, user } = useRole();
  const initials = user.name.split(" ").map(s => s[0]).join("");
  const fmtLimit = (n: number | null) =>
    n === null ? "Unlimited" : n === 0 ? "Cannot approve" : "$" + n.toLocaleString();
  return (
    <Dropdown className="w-72">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-gray-900 truncate">{user.name}</div>
            <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
            <ShieldCheck className="w-3 h-3" />
            {role.name}
          </span>
          <span className="text-gray-500">
            Limit <span className="font-medium text-gray-700">{fmtLimit(role.approvalLimit)}</span>
          </span>
        </div>
      </div>
      <div className="py-1">
        <MenuLink icon={User}        label="My profile" />
        <MenuLink icon={Settings}    label="Account settings" />
        <MenuLink icon={HelpCircle}  label="Help & support" />
      </div>
      <div className="border-t border-gray-100 py-1">
        <Link
          href="/login"
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2.5"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Link>
      </div>
    </Dropdown>
  );
}

function MenuLink({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-gray-500" />
      {label}
    </button>
  );
}
