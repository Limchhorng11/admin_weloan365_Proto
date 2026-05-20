"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Newspaper,
  Settings,
  Search,
  PanelLeft,
  ChevronDown,
  MessageSquareText,
  Star,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LATEST_VERSION } from "./app-version";
import { SettingsModal } from "./settings-modal";
import { useRole } from "@/lib/role-context";

type Leaf = { label: string; href: string; icon?: LucideIcon; permission?: string };
type NavItem =
  | { label: string; href: string; icon: LucideIcon; permission?: string; children?: never }
  | { label: string; icon: LucideIcon; children: Leaf[]; permission?: string; href?: never };

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ label: "Report & Analyze", href: "/", icon: LayoutDashboard }],
  },
  {
    section: "Work",
    items: [
      {
        label: "Customer",
        icon: Users,
        permission: "customer.view",
        children: [
          { label: "All Accounts", href: "/customer/accounts", icon: UserCircle2, permission: "customer.view" },
          { label: "Consultations", href: "/customer/consultations", icon: MessageSquareText, permission: "customer.view" },
          { label: "Feedback & Rate", href: "/customer/feedback", icon: Star, permission: "customer.view" },
        ],
      },
      { label: "Loan Application", href: "/customer/applications", icon: FileText, permission: "loan.view" },
      { label: "Loan Product", href: "/loan-product", icon: Package, permission: "loan.view" },
      { label: "Blog Posts", href: "/content/posts", icon: Newspaper },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { can } = useRole();

  // Filter NAV based on the current role's permissions.
  const filteredNav = useMemo(() => {
    return NAV.map(group => ({
      ...group,
      items: group.items.flatMap(item => {
        if ("children" in item && item.children) {
          const allowedChildren = item.children.filter(c => !c.permission || can(c.permission));
          if (allowedChildren.length === 0) return [];
          return [{ ...item, children: allowedChildren }] as NavItem[];
        }
        if (item.permission && !can(item.permission)) return [];
        return [item] as NavItem[];
      }),
    })).filter(g => g.items.length > 0);
  }, [can]);

  const defaultExpanded = useMemo(() => {
    const state: Record<string, boolean> = { Customer: true };
    NAV.forEach(g =>
      g.items.forEach(it => {
        if ("children" in it && it.children?.some(c => pathname.startsWith(c.href))) {
          state[it.label] = true;
        }
      })
    );
    return state;
  }, [pathname]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(defaultExpanded);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isActive = (href?: string) =>
    !href
      ? false
      : href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  const toggle = (label: string) =>
    setExpanded(e => ({ ...e, [label]: !(e[label] ?? false) }));

  const renderItem = (item: NavItem) => {
    if ("children" in item && item.children) {
      const open = expanded[item.label] ?? false;
      const hasActive = item.children.some(c => isActive(c.href));
      return (
        <div key={item.label}>
          <button
            onClick={() => toggle(item.label)}
            className={cn(
              "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px]",
              hasActive ? "text-gray-900" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <item.icon
              className={cn("w-[18px] h-[18px]", hasActive ? "text-brand-600" : "text-gray-500")}
            />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={cn("w-3.5 h-3.5 text-gray-400 transition", open && "rotate-180")}
            />
          </button>
          {open && (
            <div className="mt-0.5 ml-[14px] pl-3 border-l border-gray-200 space-y-0.5">
              {item.children.map(child => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px]",
                    isActive(child.href)
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {child.icon && <child.icon className="w-[14px] h-[14px]" />}
                  <span>{child.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href!}
        className={cn(
          "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px]",
          active ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <item.icon
          className={cn("w-[18px] h-[18px]", active ? "text-brand-600" : "text-gray-500")}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-screen sticky top-0">
        <div className="h-16 px-5 border-b border-gray-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
              W
            </div>
            <span className="font-semibold text-gray-900 text-[15px]">WeLoan365</span>
          </Link>
          <button className="p-1.5 rounded-md hover:bg-gray-100" title="Collapse">
            <PanelLeft className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              placeholder="Search..."
              className="w-full pl-8 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <kbd className="absolute right-2 top-1.5 text-[11px] text-gray-400 bg-white border border-gray-200 rounded px-1">
              /
            </kbd>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
          {filteredNav.map(group => (
            <div key={group.section} className="mb-4">
              <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                {group.section}
              </div>
              <div className="space-y-0.5">{group.items.map(renderItem)}</div>
            </div>
          ))}

          <div className="mb-4">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-2 mb-1.5">
              Others
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] text-gray-700 hover:bg-gray-100"
            >
              <Settings className="w-[18px] h-[18px] text-gray-500" />
              <span>Setting</span>
            </button>
          </div>
        </nav>

        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>WeLoan365 Admin</span>
            <span className="font-medium">v{LATEST_VERSION}</span>
          </div>
        </div>
      </aside>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
