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
  Megaphone,
  Settings,
  PanelLeft,
  ChevronDown,
  MessageSquareText,
  MessageCircle,
  Star,
  UserCircle2,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand-logo";
import { LATEST_VERSION } from "./app-version";
import { SettingsModal } from "./settings-modal";
import { useRole } from "@/lib/role-context";
import { CHATS } from "@/lib/data";

type Leaf = {
  label: string;
  href: string;
  icon?: LucideIcon;
  permission?: string;
  /** Extra paths that should also highlight this nav item (e.g. when one
   *  sidebar entry hosts multiple in-page tabs across two routes). */
  matchHrefs?: string[];
};
type NavItem =
  | { label: string; href: string; icon: LucideIcon; permission?: string; children?: never }
  | { label: string; icon: LucideIcon; children: Leaf[]; permission?: string; href?: never };

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
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
          // Consultations and Feedback are separate sections, each with its own table.
          { label: "Consultation", href: "/customer/consultations", icon: MessageSquareText, permission: "consultation.view" },
          { label: "Complaint", href: "/customer/feedback", icon: Star, permission: "feedback.view" },
          { label: "Chat", href: "/chat", icon: MessageCircle },
        ],
      },
      { label: "Loan Application", href: "/customer/applications", icon: FileText, permission: "loan.view" },
      { label: "Loan Product", href: "/loan-product", icon: Package, permission: "loan.view" },
      {
        label: "Media",
        icon: Newspaper,
        children: [
          { label: "Promotion", href: "/content/promotions", icon: Megaphone, permission: "promotion.manage" },
          { label: "Blog Posts", href: "/content/posts", icon: Newspaper, permission: "post.manage" },
          // Own route — reuses the Blog Posts editor/table with the category
          // locked to CSR (see app/content/csr/page.tsx).
          { label: "CSR", href: "/content/csr", icon: HeartHandshake, permission: "post.manage" },
        ],
      },
    ],
  },
];

export function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { can } = useRole();
  const hasUnreadChat = CHATS.some(c => c.unread > 0);

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
        if (
          "children" in it &&
          it.children?.some(c => pathname.startsWith(c.href) || c.matchHrefs?.some(h => pathname.startsWith(h)))
        ) {
          state[it.label] = true;
        }
      })
    );
    return state;
  }, [pathname]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(defaultExpanded);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const matchesPath = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const isActive = (href?: string, matchHrefs?: string[]) => {
    if (!href) return false;
    if (matchesPath(href)) return true;
    return matchHrefs?.some(matchesPath) ?? false;
  };

  const toggle = (label: string) =>
    setExpanded(e => ({ ...e, [label]: !(e[label] ?? false) }));

  const renderItem = (item: NavItem) => {
    if ("children" in item && item.children) {
      const open = expanded[item.label] ?? false;
      const hasActive = item.children.some(c => isActive(c.href, c.matchHrefs));
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
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px]",
                    isActive(child.href, child.matchHrefs)
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {child.icon && <child.icon className="w-[14px] h-[14px]" />}
                  <span>{child.label}</span>
                  {child.href === "/chat" && hasUnreadChat && (
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                  )}
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
        onClick={onClose}
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
      {/* Mobile backdrop — only visible while the drawer is open on small screens. */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-screen z-50",
          // Mobile: off-canvas drawer that slides in from the left.
          "fixed inset-y-0 left-0 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: static sticky column, always visible.
          "lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto"
        )}
      >
        <div className="h-16 px-5 border-b border-gray-200 flex items-center justify-between">
          <Link href="/" onClick={onClose}>
            <BrandLogo size={32} />
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100"
            title="Close menu"
          >
            <PanelLeft className="w-4 h-4 text-gray-500" />
          </button>
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
