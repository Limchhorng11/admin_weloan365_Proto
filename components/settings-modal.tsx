"use client";

import { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Users,
  LayoutGrid,
  Building2,
  MapPin,
  ShieldCheck,
  LifeBuoy,
  Mail,
  Phone,
  Gift,
  Copy,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppVersion } from "./app-version";
import { BRANCHES } from "@/lib/data";
import { UsersRolesView } from "./users-roles-view";
import { useRole } from "@/lib/role-context";

type SectionKey =
  | "app"
  | "users"
  | "menu"
  | "company"
  | "branches"
  | "referral"
  | "policy"
  | "support";

type Section = {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  badge?: string;
  group: "main" | "more";
  /** permission required to see this section. Undefined = always visible. */
  permission?: string;
};

const SECTIONS: Section[] = [
  { key: "app",      label: "App Setting",      icon: Smartphone,  group: "main", badge: "Admin", permission: "setting.edit" },
  { key: "users",    label: "Users & Roles",    icon: Users,       group: "main", permission: "user.view" },
  { key: "menu",     label: "Menu Setting",     icon: LayoutGrid,  group: "main", permission: "setting.edit" },
  { key: "company",  label: "Company Profile",  icon: Building2,   group: "main", permission: "setting.edit" },
  { key: "branches", label: "Branch Locator",   icon: MapPin,      group: "main", permission: "setting.view" },
  { key: "referral", label: "Referral Program", icon: Gift,        group: "main", badge: "New", permission: "setting.edit" },
  { key: "policy",   label: "App Policy",       icon: ShieldCheck, group: "more" },
  { key: "support",  label: "Support",          icon: LifeBuoy,    group: "more" },
];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { can } = useRole();
  const visibleSections = SECTIONS.filter(s => !s.permission || can(s.permission));
  const firstAllowed = visibleSections[0]?.key ?? "support";

  const [history, setHistory] = useState<SectionKey[]>([firstAllowed]);
  const [cursor, setCursor] = useState(0);
  const section = history[cursor];

  // If the role changes and the active section is no longer allowed, jump to first allowed.
  useEffect(() => {
    if (!visibleSections.some(s => s.key === section)) {
      setHistory([firstAllowed]);
      setCursor(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstAllowed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const selectSection = (key: SectionKey) => {
    if (key === section) return;
    const next = [...history.slice(0, cursor + 1), key];
    setHistory(next);
    setCursor(next.length - 1);
  };

  const canBack = cursor > 0;
  const canFwd = cursor < history.length - 1;

  if (!open) return null;

  const current = visibleSections.find(s => s.key === section) ?? visibleSections[0];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-5xl h-[85vh] max-h-[800px] flex overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Left nav */}
        <aside className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="px-5 py-4">
            <div className="text-[13px] font-medium text-gray-500">Settings</div>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
            <div className="space-y-0.5">
              {visibleSections.filter(s => s.group === "main").map(s => (
                <SectionButton
                  key={s.key}
                  section={s}
                  active={s.key === section}
                  onClick={() => selectSection(s.key)}
                />
              ))}
            </div>
            {visibleSections.some(s => s.group === "more") && (
              <>
                <div className="mt-5 px-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  More
                </div>
                <div className="space-y-0.5">
                  {visibleSections.filter(s => s.group === "more").map(s => (
                    <SectionButton
                      key={s.key}
                      section={s}
                      active={s.key === section}
                      onClick={() => selectSection(s.key)}
                    />
                  ))}
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Right content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="h-14 px-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => canBack && setCursor(c => c - 1)}
                disabled={!canBack}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent text-gray-500"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => canFwd && setCursor(c => c + 1)}
                disabled={!canFwd}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent text-gray-500"
                aria-label="Forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="ml-2 text-sm font-medium text-gray-700">{current.label}</div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {section === "app"      && <AppSettingView />}
            {section === "users"    && <UsersRolesView />}
            {section === "menu"     && <MenuView />}
            {section === "company"  && <CompanyView />}
            {section === "branches" && <BranchesView />}
            {section === "referral" && <ReferralView />}
            {section === "policy"   && <PolicyView />}
            {section === "support"  && <SupportView />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionButton({
  section,
  active,
  onClick,
}: {
  section: Section;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition",
        active
          ? "bg-white shadow-sm text-gray-900 font-medium"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <section.icon className={cn("w-[16px] h-[16px]", active ? "text-gray-800" : "text-gray-500")} />
      <span className="flex-1 text-left">{section.label}</span>
      {section.badge && (
        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
          {section.badge}
        </span>
      )}
    </button>
  );
}

/* ---------- shared helpers ---------- */

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-gray-900">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 mt-0.5">{children}</p>;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5", className)}>{children}</div>
  );
}

function Toggle({ checked }: { checked: boolean }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={checked} className="sr-only peer" />
      <div className="w-10 h-5 bg-gray-200 peer-checked:bg-brand-600 rounded-full relative transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 peer-checked:after:translate-x-5 after:transition" />
    </label>
  );
}

function Field({
  label,
  defaultValue,
  textarea,
}: {
  label: string;
  defaultValue: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {textarea ? (
        <textarea
          rows={2}
          defaultValue={defaultValue}
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      ) : (
        <input
          defaultValue={defaultValue}
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      )}
    </div>
  );
}

/* ---------- views ---------- */

function AppSettingView() {
  return (
    <div className="space-y-5">
      <div>
        <H2>App Setting</H2>
        <P>Version, features, and platform configuration.</P>
      </div>
      <Card>
        <div className="font-medium text-gray-900 mb-3">Admin console version</div>
        <AppVersion />
      </Card>
      <Card>
        <div className="font-medium text-gray-900 mb-3">Customer app versions</div>
        <div className="space-y-2.5 text-sm">
          <Row label="Current version (iOS)" value="2.1.4" />
          <Row label="Current version (Android)" value="2.1.3" />
          <Row label="Minimum supported" value="2.0.0" />
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <div className="font-medium text-gray-900">Force update</div>
              <div className="text-xs text-gray-500">Require users below min version to update</div>
            </div>
            <Toggle checked />
          </div>
        </div>
      </Card>
      <Card>
        <div className="font-medium text-gray-900 mb-3">Feature flags</div>
        <div className="space-y-1 text-sm">
          {[
            ["Biometric login", true],
            ["Push notifications", true],
            ["In-app chat", true],
            ["ABA Pay integration", true],
            ["Wing integration", true],
            ["Dark mode", false],
            ["Multi-account", false],
          ].map(([n, v]) => (
            <div
              key={n as string}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div>{n}</div>
              <Toggle checked={v as boolean} />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="font-medium text-gray-900 mb-3">Security</div>
        <div className="space-y-2.5 text-sm">
          <Row label="Session timeout" value="30 minutes" />
          <Row label="2FA for staff" value="Required" />
          <Row label="Password policy" value="Strong" />
          <Row label="Failed attempts lockout" value="5 attempts" />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function MenuView() {
  const MENUS = [
    { name: "Home", show: true },
    { name: "My Loans", show: true },
    { name: "Apply for Loan", show: true },
    { name: "Repayment Schedule", show: true },
    { name: "Blogs", show: false },
    { name: "Chat Support", show: true },
    { name: "Branches", show: true },
    { name: "Feedback", show: true },
    { name: "Settings", show: true },
  ];
  return (
    <div className="space-y-5">
      <div>
        <H2>Menu Setting</H2>
        <P>Toggle off to hide a menu from the customer app.</P>
      </div>
      <Card>
        <div className="space-y-1 text-sm">
          {MENUS.map(m => (
            <div
              key={m.name}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-900">{m.name}</div>
              <Toggle checked={m.show} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CompanyView() {
  return (
    <div className="space-y-5">
      <div>
        <H2>Company Profile</H2>
        <P>Update shared vision, goals and contact info.</P>
      </div>
      <Card className="space-y-4">
        <div className="font-medium text-gray-900">Company information</div>
        <Field label="Company name" defaultValue="KoSign Microfinance Plc." />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Founded" defaultValue="2018" />
          <Field label="License №" defaultValue="NBC-MFI-00123" />
        </div>
        <Field
          label="Vision"
          textarea
          defaultValue="To be Cambodia's most trusted microfinance partner, expanding financial access to every household."
        />
        <Field
          label="Mission"
          textarea
          defaultValue="Deliver responsible, transparent lending that helps customers grow."
        />
      </Card>
      <Card className="space-y-3">
        <div className="font-medium text-gray-900">Contact & social</div>
        <Field label="Support phone" defaultValue="+855 23 900 000" />
        <Field label="Support email" defaultValue="support@loanops.kh" />
        <Field label="Website" defaultValue="https://loanops.kh" />
      </Card>
      <div className="flex justify-end">
        <button className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
          Save changes
        </button>
      </div>
    </div>
  );
}

function BranchesView() {
  const { can } = useRole();
  return (
    <div className="space-y-5">
      <div>
        <H2>Branch Locator</H2>
        <P>{BRANCHES.length} branches across Cambodia.</P>
      </div>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium text-gray-900">All branches</div>
          {can("setting.edit") && (
            <button className="px-3 py-1 text-xs bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
              Add branch
            </button>
          )}
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Branch", "Address", "Phone", "Hours"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[12px] font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BRANCHES.map(b => (
                <tr key={b.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{b.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.address}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.phone}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{b.open}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReferralView() {
  const { can } = useRole();
  const readOnly = !can("setting.edit");

  type CodeRow = {
    code: string;
    name: string;
    role: string;
    branch: string;
    referrals: number;
    applications: number;
    disbursed: number;
    status: "Active" | "Disabled";
  };

  const CO_CODES: CodeRow[] = [
    { code: "10247", name: "Laybun N.",   role: "Credit Officer",        branch: "Phnom Penh", referrals: 28, applications: 19, disbursed: 11, status: "Active"   },
    { code: "10248", name: "Sophea K.",   role: "Senior Credit Officer", branch: "Siem Reap",  referrals: 41, applications: 32, disbursed: 21, status: "Active"   },
    { code: "10312", name: "Ratanak L.",  role: "Branch Manager",        branch: "Battambang", referrals: 14, applications:  9, disbursed:  5, status: "Active"   },
    { code: "10401", name: "Pisey C.",    role: "Cashier",               branch: "Phnom Penh", referrals:  6, applications:  3, disbursed:  1, status: "Active"   },
    { code: "10502", name: "Mengsrun H.", role: "Approval Committee",    branch: "HQ",         referrals:  0, applications:  0, disbursed:  0, status: "Disabled" },
  ];

  const RECENT: { customer: string; cid: string; code: string; officer: string; when: string; state: string }[] = [
    { customer: "Sokha Chan", cid: "C-0421", code: "10247", officer: "Laybun N.",  when: "2026-05-16 14:22", state: "Application submitted" },
    { customer: "Dara Meas",  cid: "C-0422", code: "10248", officer: "Sophea K.",  when: "2026-05-16 11:05", state: "Disbursed" },
    { customer: "Vichet Lim", cid: "C-0423", code: "10247", officer: "Laybun N.",  when: "2026-05-15 16:40", state: "KYC verified" },
    { customer: "Pisey Ros",  cid: "C-0424", code: "10248", officer: "Sophea K.",  when: "2026-05-15 09:11", state: "Disbursed" },
    { customer: "Bopha Sok",  cid: "C-0426", code: "10312", officer: "Ratanak L.", when: "2026-05-14 13:30", state: "Application submitted" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <H2>Referral Program</H2>
          <P>Customers enter a 5-digit Credit Officer code at signup. Track conversions per officer.</P>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">Program status</span>
          <Toggle checked />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        <StatTile label="Active codes" value="14" delta="+2" />
        <StatTile label="Customers referred" value="287" delta="+24" />
        <StatTile label="Applications" value="173" delta="+18" />
        <StatTile label="Disbursed conversion" value="42.1%" delta="+1.8%" />
      </div>

      {/* Code policy */}
      <Card>
        <div className="font-medium text-gray-900 mb-3">Code policy</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Code length</label>
            <input
              readOnly
              defaultValue="5 digits"
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
            />
            <div className="text-[11px] text-gray-500 mt-1">Numeric only · range 10000–99999</div>
          </div>
          <Field label="Eligible roles" defaultValue="Credit Officer, Senior CO, Branch Manager" />
        </div>
        <div className="mt-4 space-y-1 text-sm">
          {[
            ["Referral code required at signup", false, "Customer must enter a CO code to create an account"],
            ["Allow entry on first application",  true, "Customer can add the code on their first loan application instead of signup"],
            ["Lock code after first use",         true, "Prevent customers from changing the code once a referral is counted"],
            ["Auto-issue code for new officers",  true, "Generate a unique 5-digit code when an eligible CO user is created"],
          ].map(([n, v, d]) => (
            <div
              key={n as string}
              className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="min-w-0">
                <div className="font-medium text-gray-900">{n}</div>
                <div className="text-xs text-gray-500">{d}</div>
              </div>
              <Toggle checked={v as boolean} />
            </div>
          ))}
        </div>
      </Card>

      {/* Officer commission */}
      <Card>
        <div className="font-medium text-gray-900 mb-1">Officer commission</div>
        <div className="text-xs text-gray-500 mb-3">
          Reward paid to the officer when a referred customer&apos;s loan is disbursed.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Commission per disbursed loan (USD)" defaultValue="10" />
          <Field label="Max commission / officer / month (USD)" defaultValue="500" />
        </div>
      </Card>

      {/* CO codes table */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium text-gray-900">Credit Officer codes</div>
            <div className="text-xs text-gray-500 mt-0.5">One unique 5-digit code per officer.</div>
          </div>
          {!readOnly && (
            <button className="px-3 py-1 text-xs bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
              Issue new code
            </button>
          )}
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Code", "Officer", "Branch", "Referrals", "Apps", "Disbursed", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[12px] font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CO_CODES.map(r => (
                <tr key={r.code} className="border-t border-gray-100">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-gray-900 tracking-wider">{r.code}</span>
                      <button
                        className="text-gray-400 hover:text-gray-700"
                        aria-label={`Copy code ${r.code}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.role}</div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{r.branch}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.referrals}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.applications}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{r.disbursed}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                        r.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!readOnly && (
                      <button className="text-xs text-brand-600 hover:underline font-medium">
                        Regenerate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent activity */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <div className="font-medium text-gray-900">Recent code redemptions</div>
          </div>
          <button className="text-xs text-brand-600 hover:underline font-medium">View all</button>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Customer", "Code used", "Officer", "When", "Latest state"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[12px] font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT.map(r => (
                <tr key={r.cid + r.when} className="border-t border-gray-100">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{r.customer}</div>
                    <div className="text-xs text-gray-500">{r.cid}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">{r.code}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.officer}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{r.when}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <button className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  delta,
  negative,
}: {
  label: string;
  value: string;
  delta: string;
  negative?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
      <div
        className={cn(
          "mt-1 text-[11px] font-medium",
          negative ? "text-rose-600" : "text-emerald-600"
        )}
      >
        {delta} vs. prev. period
      </div>
    </div>
  );
}

function PolicyView() {
  const POLICIES: [string, string, string][] = [
    ["Terms & Conditions", "v2.4", "2026-01-15"],
    ["Privacy Policy", "v1.8", "2025-11-02"],
    ["Compliance Laws", "v3.1", "2026-02-20"],
    ["Cookie Policy", "v1.2", "2025-08-30"],
    ["Interest & Fees Disclosure", "v2.0", "2026-03-01"],
    ["Customer Complaint Process", "v1.5", "2025-09-12"],
  ];
  return (
    <div className="space-y-5">
      <div>
        <H2>App Policy</H2>
        <P>Update T&amp;Cs and compliance documents.</P>
      </div>
      <Card>
        <div className="divide-y divide-gray-100">
          {POLICIES.map(([t, v, d]) => (
            <div key={t} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{t}</div>
                  <div className="text-xs text-gray-500">
                    {v} · Updated {d}
                  </div>
                </div>
              </div>
              <button className="text-xs text-brand-600 hover:underline font-medium">Edit</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SupportView() {
  return (
    <div className="space-y-5">
      <div>
        <H2>Support</H2>
        <P>Get help or contact the WeLoan365 team.</P>
      </div>
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">Email support</div>
            <div className="text-xs text-gray-500">Typical response time: under 4 hours</div>
            <a
              href="mailto:support@loanops.kh"
              className="mt-2 inline-block text-sm text-brand-600 hover:underline font-medium"
            >
              support@loanops.kh
            </a>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">Phone support</div>
            <div className="text-xs text-gray-500">Mon–Fri, 8:00–17:00 ICT</div>
            <a
              href="tel:+85523900000"
              className="mt-2 inline-block text-sm text-brand-600 hover:underline font-medium"
            >
              +855 23 900 000
            </a>
          </div>
        </div>
      </Card>
      <Card>
        <div className="font-medium text-gray-900 mb-1">Helpful links</div>
        <ul className="mt-2 text-sm space-y-2">
          <li>
            <a className="text-brand-600 hover:underline" href="#">
              Knowledge base &amp; FAQ
            </a>
          </li>
          <li>
            <a className="text-brand-600 hover:underline" href="#">
              Release notes
            </a>
          </li>
          <li>
            <a className="text-brand-600 hover:underline" href="#">
              Report a bug
            </a>
          </li>
        </ul>
      </Card>
    </div>
  );
}
