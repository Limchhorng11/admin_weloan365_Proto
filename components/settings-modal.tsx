"use client";

import { useEffect, useState } from "react";
import {
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  Eye,
  FileText,
  History,
  Download,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  List,
  Map as MapIcon,
  Pencil,
  Trash2,
  Plus,
  Cake,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRANCHES, USERS, type Branch } from "@/lib/data";
import { UsersRolesView } from "./users-roles-view";
import { StatusBadge } from "./status-badge";
import { useRole } from "@/lib/role-context";

type SectionKey =
  | "app"
  | "users"
  | "menu"
  | "company"
  | "branches"
  | "referral"
  | "birthday"
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
  { key: "users",    label: "User & Role",      icon: Users,       group: "main", permission: "user.view" },
  { key: "menu",     label: "Apply Loan Setting", icon: LayoutGrid,  group: "main", permission: "setting.edit" },
  { key: "company",  label: "Company Profile",  icon: Building2,   group: "main", permission: "setting.edit" },
  { key: "branches", label: "Branch Locator",   icon: MapPin,      group: "main", permission: "setting.view" },
  { key: "referral", label: "Referral Program", icon: Gift,        group: "main", badge: "New", permission: "setting.edit" },
  { key: "birthday", label: "Birthday Notification", icon: Cake,   group: "main", permission: "setting.edit" },
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

  // Mobile master-detail: below sm we show EITHER the section list or the
  // selected section's content (with a back button) — never both at once.
  // Desktop keeps the side-by-side split regardless of this flag.
  const [mobileDetail, setMobileDetail] = useState(false);

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

  // Reset to the section list each time the modal opens (mobile).
  useEffect(() => {
    if (open) setMobileDetail(false);
  }, [open]);

  const selectSection = (key: SectionKey) => {
    setMobileDetail(true); // open the detail pane on mobile
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
        className="bg-white rounded-xl w-full max-w-6xl h-[85vh] max-h-[800px] flex flex-col sm:flex-row overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Left nav */}
        <aside
          className={cn(
            "w-full sm:w-60 bg-gray-50 sm:border-r border-gray-200 flex-col flex-shrink-0",
            mobileDetail ? "hidden sm:flex" : "flex"
          )}
        >
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
        <div
          className={cn(
            "flex-1 flex-col min-w-0 bg-white",
            mobileDetail ? "flex" : "hidden sm:flex"
          )}
        >
          <div className="h-14 px-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMobileDetail(false)}
                className="p-1.5 -ml-1.5 mr-0.5 rounded-md hover:bg-gray-100 text-gray-500 sm:hidden"
                aria-label="Back to settings menu"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => canBack && setCursor(c => c - 1)}
                disabled={!canBack}
                className="hidden sm:inline-flex p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent text-gray-500"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => canFwd && setCursor(c => c + 1)}
                disabled={!canFwd}
                className="hidden sm:inline-flex p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent text-gray-500"
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
            {section === "birthday" && <BirthdayView />}
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

function Toggle({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <label
      className={cn(
        "inline-flex items-center",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <input
        type="checkbox"
        defaultChecked={checked}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={cn(
          "w-10 h-5 rounded-full relative transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 peer-checked:after:translate-x-5 after:transition",
          disabled
            ? "bg-gray-200 opacity-50"
            : "bg-gray-200 peer-checked:bg-brand-600"
        )}
      />
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
  const [adminCurrent, setAdminCurrent] = useState("0.2.0");
  const [adminLatest, setAdminLatest] = useState("0.3.1");
  const [iosVer, setIosVer] = useState("2.1.4");
  const [androidVer, setAndroidVer] = useState("2.1.3");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  // "Alert now" only activates after the admin saves the version changes.
  const [committed, setCommitted] = useState(false);

  const versionsFilled = iosVer.trim() !== "" && androidVer.trim() !== "";

  const save = () => {
    setEditing(false);
    setCommitted(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const startEdit = () => {
    setEditing(true);
    setCommitted(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <H2>Customer App Version</H2>
        <P>Manage the customer mobile app&apos;s version information.</P>
      </div>
      <Card>
        <div className="font-medium text-gray-900 mb-3">Admin console version</div>
        <div className="space-y-2.5 text-sm">
          <VersionRow label="Current version" value={adminCurrent} onChange={setAdminCurrent} prefix editing={editing} />
          <VersionRow label="Latest version"  value={adminLatest}  onChange={setAdminLatest} prefix editing={editing} />
        </div>
      </Card>
      <Card>
        <div className="font-medium text-gray-900 mb-3">Customer app version</div>
        <div className="space-y-2.5 text-sm">
          <VersionRow label="Current version (iOS)" value={iosVer} onChange={setIosVer} editing={editing} />
          <VersionRow label="Current version (Android)" value={androidVer} onChange={setAndroidVer} editing={editing} />
        </div>

        {/* Customer-update alert — "Alert now" enables only after Save changes */}
        <CustomerUpdateAlert ready={committed && versionsFilled} />
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
        {editing ? (
          <button
            onClick={save}
            className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
          >
            Save changes
          </button>
        ) : (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

/** A labelled version field. Shows plain text normally; an input (digits + dots) when editing. */
function VersionRow({
  label,
  value,
  onChange,
  prefix,
  editing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: boolean;
  editing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-gray-600">{label}</label>
      {editing ? (
        <div className="relative">
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              v
            </span>
          )}
          <input
            value={value}
            inputMode="decimal"
            onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
            className={cn(
              "w-28 text-right pr-2.5 py-1 border border-gray-200 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
              prefix ? "pl-6" : "pl-2.5"
            )}
          />
        </div>
      ) : (
        <span className="font-medium text-gray-900">
          {prefix ? "v" : ""}
          {value}
        </span>
      )}
    </div>
  );
}

/* ---------- Apply Loan Setting (per-page, field-level editor) ---------- */

type FlowField = { name: string; show: boolean; required?: boolean };
/** a page can group its fields into named sections (e.g. Step 1 = "Tell us about you" + "Choose your branch") */
type FlowSection = { name: string; show: boolean; fields: FlowField[] };
type FlowPage = {
  name: string;
  show: boolean;
  system?: boolean;
  fields: FlowField[];
  /** when present, fields are grouped into sections instead of the flat `fields` list */
  sections?: FlowSection[];
  /** editable confirmation / SMS / intro message shown to the customer on this page */
  description?: string;
  /** section title for the message editor (e.g. "Confirmation message") */
  messageLabel?: string;
  /** placeholder tokens offered for this message; auto-filled for the customer */
  placeholders?: string[];
};
type FlowKind = "mwl" | "nonMwl";

const DEFAULT_PLACEHOLDERS = ["{name}", "{product}", "{phone}"];

/** field builders — keep the seed data readable */
const req = (name: string): FlowField => ({ name, show: true, required: true });
const opt = (name: string): FlowField => ({ name, show: true });

const MWL_PAGES: FlowPage[] = [
  { name: "Step 1 — Tell us about you", show: true, fields: [], sections: [
    { name: "Where are you heading?", show: true, fields: [
      opt("Korea — EPS · most active"),
      opt("Japan — SSW / Technical intern"),
      opt("Singapore — Work Permit / S Pass"),
    ] },
    { name: "Your info", show: true, fields: [
      req("First name"), req("Last name"), req("Mobile number"),
      req("City"), req("Current occupation"), req("Marital status"),
      req("Select branch"),
    ] },
    { name: "Upload your documents", show: true, fields: [
      req("National ID Card"), req("Selfie with NID"), opt("Family Book"),
    ] },
  ] },
  { name: "Step 2 — Loan request", show: true, fields: [
    req("Requested amount (within product range)"), req("Currency"),
    req("Loan term"), opt("Monthly interest (auto)"),
    req("Repayment method"), opt("Payment estimate / repayment table"),
  ] },
  { name: "Step 3 — Add your guarantor", show: true, fields: [
    req("Full name"), req("Mobile number"), req("Relationship"),
  ] },
  { name: "Review your application", show: true, fields: [], sections: [
    { name: "Customer info", show: true, fields: [
      opt("Full name"), opt("Phone"), opt("City"),
      opt("Current occupation"), opt("Marital status"), opt("Select branch"),
    ] },
    { name: "Loan request", show: true, fields: [
      opt("Amount"), opt("Loan term"), opt("Monthly interest"), opt("Repayment method"),
    ] },
    { name: "Guarantor", show: true, fields: [
      opt("Full name"), opt("Mobile number"), opt("Relationship"),
    ] },
  ] },
  { name: "E-Signature", show: true, fields: [ req("Draw signature") ] },
  { name: "Application submitted", show: true, system: true, fields: [],
    messageLabel: "Confirmation message",
    description:
      "Thank you, {name}. Your {product} application has been submitted. " +
      "Our loan officer will contact you at {phone} within 1 business day." },
];

/** Non-MWL (quick / domestic) flow — two steps for the customer:
 *  Step 1 "Tell us about you" (personal info + document uploads) →
 *  Step 2 "Loan request" (amount, term, repayment) → request received. */
const NON_MWL_PAGES: FlowPage[] = [
  { name: "Step 1 — Tell us about you", show: true, fields: [], sections: [
    { name: "Your info", show: true, fields: [
      req("First name"), req("Last name"), req("Mobile number"),
      req("City"), req("Current occupation"), req("Marital status"),
      req("Select branch"),
    ] },
    { name: "Upload your documents", show: true, fields: [
      req("National ID Card"), req("Selfie with NID"), opt("Family book"),
    ] },
  ] },
  { name: "Step 2 — Loan request", show: true, fields: [
    req("Requested amount (within product range)"), req("Currency"),
    req("Loan term"), opt("Monthly interest (auto)"),
    req("Repayment method"), opt("Payment estimate / repayment table"),
  ] },
  { name: "Review your application", show: true, fields: [], sections: [
    { name: "Customer info", show: true, fields: [
      opt("Full name"), opt("Phone"), opt("City"),
      opt("Current occupation"), opt("Marital status"), opt("Select branch"),
    ] },
    { name: "Loan request", show: true, fields: [
      opt("Amount"), opt("Loan term"), opt("Monthly interest"), opt("Repayment method"),
    ] },
  ] },
  { name: "E-Signature", show: true, fields: [ req("Draw signature") ] },
  { name: "Request received", show: true, system: true, fields: [],
    messageLabel: "Confirmation message",
    description:
      "Thank you, {name}. Your loan request for {product} has been submitted. " +
      "Our loan officer will contact you at {phone} within 1 business day." },
];

function SwitchToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative w-10 h-5 rounded-full transition flex-shrink-0",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        checked ? "bg-brand-600" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 bg-white rounded-full h-4 w-4 transition",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

function MenuView() {
  const [flows, setFlows] = useState<Record<FlowKind, FlowPage[]>>({
    mwl: MWL_PAGES,
    nonMwl: NON_MWL_PAGES,
  });
  const [tab, setTab] = useState<FlowKind>("mwl");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const pages = flows[tab];
  const enabledCount = pages.filter(p => p.show).length;

  const switchTab = (k: FlowKind) => {
    setTab(k);
    setOpenIdx(null);
  };

  const togglePage = (idx: number) =>
    setFlows(prev => ({
      ...prev,
      [tab]: prev[tab].map((p, i) => (i === idx ? { ...p, show: !p.show } : p)),
    }));

  const toggleField = (pageIdx: number, fieldIdx: number) =>
    setFlows(prev => ({
      ...prev,
      [tab]: prev[tab].map((p, i) =>
        i === pageIdx
          ? {
              ...p,
              fields: p.fields.map((f, j) =>
                j === fieldIdx ? { ...f, show: !f.show } : f
              ),
            }
          : p
      ),
    }));

  const toggleSection = (pageIdx: number, secIdx: number) =>
    setFlows(prev => ({
      ...prev,
      [tab]: prev[tab].map((p, i) =>
        i === pageIdx
          ? {
              ...p,
              sections: p.sections?.map((s, k) =>
                k === secIdx ? { ...s, show: !s.show } : s
              ),
            }
          : p
      ),
    }));

  const toggleSectionField = (pageIdx: number, secIdx: number, fieldIdx: number) =>
    setFlows(prev => ({
      ...prev,
      [tab]: prev[tab].map((p, i) =>
        i === pageIdx
          ? {
              ...p,
              sections: p.sections?.map((s, k) =>
                k === secIdx
                  ? {
                      ...s,
                      fields: s.fields.map((f, j) =>
                        j === fieldIdx ? { ...f, show: !f.show } : f
                      ),
                    }
                  : s
              ),
            }
          : p
      ),
    }));

  const updateDescription = (pageIdx: number, value: string) =>
    setFlows(prev => ({
      ...prev,
      [tab]: prev[tab].map((p, i) =>
        i === pageIdx ? { ...p, description: value } : p
      ),
    }));

  /* ----- Description editor draft state -----
   * The expanded page's description is edited in a local draft so the operator
   * can preview / append placeholder tokens before committing. "Save" copies
   * the draft into the persistent flow data via updateDescription(). */
  const [draftDesc, setDraftDesc] = useState<string>("");
  const [justSaved, setJustSaved] = useState(false);

  // Sync the draft whenever a different page is opened (or the tab switches).
  useEffect(() => {
    if (openIdx == null) {
      setDraftDesc("");
      setJustSaved(false);
      return;
    }
    const p = flows[tab][openIdx];
    setDraftDesc(p?.description ?? "");
    setJustSaved(false);
  }, [openIdx, tab, flows]);

  const savedDesc = openIdx != null ? flows[tab][openIdx]?.description ?? "" : "";
  const isDirty = openIdx != null && draftDesc !== savedDesc;

  const saveDescription = () => {
    if (openIdx == null) return;
    updateDescription(openIdx, draftDesc);
    setJustSaved(true);
    // Clear the "Saved" badge after a couple of seconds.
    setTimeout(() => setJustSaved(false), 1800);
  };

  const TABS: { key: FlowKind; label: string }[] = [
    { key: "mwl", label: "MWL" },
    { key: "nonMwl", label: "NON-MWL" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <H2>Apply Loan Setting</H2>
        <P>
          Configure the customer-app loan application flow. Toggle a page to skip it,
          or expand a page to show / hide its individual fields.
        </P>
      </div>

      {/* Flow tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm border-b-2 -mb-px flex items-center gap-2",
              tab === t.key
                ? "border-brand-600 text-brand-700 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            {t.label}
            <span
              className={cn(
                "text-[10px] font-medium rounded-full px-1.5 py-0.5",
                tab === t.key ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
              )}
            >
              {flows[t.key].length}
            </span>
          </button>
        ))}
      </div>

      <Card className="!p-0">
        <div className="px-5 py-3 border-b border-gray-200">
          <div className="font-medium text-gray-900 text-sm">
            {tab === "mwl" ? "MWL application pages" : "Non-MWL application pages"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {pages.length} pages · {enabledCount} enabled
          </div>
        </div>

        <div className="px-3 py-2.5 max-h-[460px] overflow-y-auto scrollbar-thin space-y-1.5">
          {pages.map((p, idx) => {
            const open = openIdx === idx;
            const allFields = p.sections ? p.sections.flatMap(s => s.fields) : p.fields;
            const totalFields = allFields.length;
            const fieldsShown = allFields.filter(f => f.show).length;
            const hasMessage = p.description !== undefined;
            const canExpand = p.show && (totalFields > 0 || hasMessage);
            return (
              <div
                key={p.name}
                className={cn(
                  "rounded-lg border transition",
                  p.show ? "border-gray-200" : "border-gray-100 bg-gray-50/60 opacity-70"
                )}
              >
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-[11px] font-medium flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => canExpand && setOpenIdx(open ? null : idx)}
                    disabled={!canExpand}
                    className={cn(
                      "flex-1 min-w-0 flex items-center gap-2 text-left",
                      canExpand ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <span className="font-medium text-gray-900 text-sm truncate">{p.name}</span>
                    {p.system && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        Auto
                      </span>
                    )}
                    {hasMessage && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded flex-shrink-0">
                        Message
                      </span>
                    )}
                    {totalFields > 0 && (
                      <span className="text-[11px] text-gray-400 flex-shrink-0">
                        {fieldsShown}/{totalFields} fields
                      </span>
                    )}
                    {canExpand && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-gray-400 transition flex-shrink-0",
                          open && "rotate-180 text-brand-600"
                        )}
                      />
                    )}
                  </button>
                  <SwitchToggle
                    checked={p.show}
                    disabled={p.system}
                    onChange={() => togglePage(idx)}
                  />
                </div>

                {open && (
                  <div className="border-t border-gray-100 px-3 py-3 bg-gray-50/50 rounded-b-lg space-y-3">
                    {p.sections ? (
                      <div className="space-y-3">
                        {p.sections.map((s, si) => (
                          <div key={s.name}>
                            <div className="flex items-center justify-between px-1 mb-1">
                              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {s.name}
                              </div>
                              <SwitchToggle
                                checked={s.show}
                                onChange={() => toggleSection(idx, si)}
                              />
                            </div>
                            <div
                              className={cn(
                                "divide-y divide-gray-100 rounded-md border border-gray-100 bg-white px-2",
                                !s.show && "opacity-50"
                              )}
                            >
                              {s.fields.map((f, j) => (
                                <div
                                  key={f.name}
                                  className="flex items-center justify-between py-2 px-1"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={cn(
                                        "text-sm truncate",
                                        f.show && s.show
                                          ? "text-gray-800"
                                          : "text-gray-400 line-through"
                                      )}
                                    >
                                      {f.name}
                                    </span>
                                    {f.required && (
                                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <SwitchToggle
                                    checked={f.show}
                                    disabled={!s.show}
                                    onChange={() => toggleSectionField(idx, si, j)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="text-[11px] text-gray-400 px-1">
                          Turn a section off to hide it and all its fields. &ldquo;Required&rdquo; is a label only — any field can be hidden.
                        </div>
                      </div>
                    ) : p.fields.length > 0 ? (
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 px-1 mb-1">
                          Fields
                        </div>
                        <div className="divide-y divide-gray-100">
                          {p.fields.map((f, j) => (
                            <div
                              key={f.name}
                              className="flex items-center justify-between py-2 px-1"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={cn(
                                    "text-sm truncate",
                                    f.show ? "text-gray-800" : "text-gray-400 line-through"
                                  )}
                                >
                                  {f.name}
                                </span>
                                {f.required && (
                                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Required
                                  </span>
                                )}
                              </div>
                              <SwitchToggle
                                checked={f.show}
                                onChange={() => toggleField(idx, j)}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] text-gray-400 px-1 mt-1.5">
                          &ldquo;Required&rdquo; is a label only — any field can be hidden.
                        </div>
                      </div>
                    ) : null}

                    {hasMessage && (
                      <div>
                        <div className="flex items-center justify-between px-1 mb-1">
                          <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                            {p.messageLabel ?? "Message"}
                          </label>
                          {/* Live unsaved/saved indicator next to the Save button. */}
                          {isDirty ? (
                            <span className="text-[11px] text-amber-600 font-medium">Unsaved changes</span>
                          ) : justSaved ? (
                            <span className="text-[11px] text-emerald-600 font-medium">Saved</span>
                          ) : null}
                        </div>
                        <textarea
                          value={draftDesc}
                          onChange={e => setDraftDesc(e.target.value)}
                          rows={4}
                          placeholder="Message shown to the customer on this page…"
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 px-1 mt-1.5">
                          <span className="text-[11px] text-gray-400">Insert:</span>
                          {(p.placeholders ?? DEFAULT_PLACEHOLDERS).map(token => (
                            <button
                              key={token}
                              type="button"
                              onClick={() => setDraftDesc(d => `${d ?? ""}${token}`)}
                              className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-gray-200 bg-white text-brand-700 hover:bg-brand-50"
                            >
                              {token}
                            </button>
                          ))}
                          <span className="text-[11px] text-gray-400">— filled in automatically.</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-2 px-1">
                          <button
                            type="button"
                            onClick={() => setDraftDesc(savedDesc)}
                            disabled={!isDirty}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium rounded-md border transition",
                              isDirty
                                ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                            )}
                          >
                            Discard
                          </button>
                          <button
                            type="button"
                            onClick={saveDescription}
                            disabled={!isDirty}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium rounded-md transition",
                              isDirty
                                ? "bg-brand-600 text-white hover:bg-brand-700"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
        <Field label="Company name" defaultValue="NongHyup Finance (Cambodia) Plc." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  const canEdit = can("setting.edit");

  const [tab, setTab] = useState<"list" | "map">("list");
  const [list, setList] = useState<Branch[]>(BRANCHES);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [creating, setCreating] = useState(false);

  const nextId = (): string => {
    const maxN = list.reduce((m, b) => {
      const n = parseInt(b.id.replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `BR-${String(maxN + 1).padStart(2, "0")}`;
  };

  const handleSave = (b: Branch) => {
    setList(prev => {
      const exists = prev.find(x => x.id === b.id);
      return exists ? prev.map(x => (x.id === b.id ? b : x)) : [...prev, b];
    });
    setEditing(null);
    setCreating(false);
  };

  const handleDelete = (id: string) => {
    setList(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <H2>Branch Locator</H2>
          <P>Manage list of all branches and show them on a map in the customer app.</P>
        </div>
        {canEdit && (
          <button
            onClick={() => setCreating(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add branch
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <SubTab icon={List}    label="Branch List" active={tab === "list"} onClick={() => setTab("list")} />
        <SubTab icon={MapIcon} label="Branch Map"  active={tab === "map"}  onClick={() => setTab("map")} />
      </div>

      {tab === "list" ? (
        <BranchListPanel
          list={list}
          canEdit={canEdit}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      ) : (
        <BranchMapPanel list={list} canEdit={canEdit} onEdit={setEditing} />
      )}

      {(creating || editing) && (
        <BranchEditorModal
          initial={editing}
          nextId={nextId()}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function SubTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px",
        active
          ? "border-brand-600 text-brand-700 font-medium"
          : "border-transparent text-gray-600 hover:text-gray-900"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/* ---------- Branch list panel ---------- */

function BranchListPanel({
  list,
  canEdit,
  onEdit,
  onDelete,
}: {
  list: Branch[];
  canEdit: boolean;
  onEdit: (b: Branch) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="!p-0">
      <div className="px-5 py-3 border-b border-gray-200">
        <div className="font-medium text-gray-900">All branches</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {list.length} {list.length === 1 ? "branch" : "branches"} · name, address, contact
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              {["Branch", "Address", "Phone"].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-2 text-[12px] font-medium text-gray-500"
                >
                  {h}
                </th>
              ))}
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {list.map(b => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-gray-900">{b.name}</div>
                  <div className="text-[11px] font-mono text-gray-400">{b.id}</div>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{b.address}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.phone}</td>
                <td className="px-4 py-2.5 text-right">
                  {canEdit && (
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={() => onEdit(b)}
                        className="text-xs text-brand-600 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(b.id)}
                        className="text-xs text-red-600 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- Branch map panel ---------- */

// Cambodia bounding box (approx). Map pins position from lat/lng.
const MAP_BOUNDS = { latMin: 10.4, latMax: 14.7, lngMin: 102.4, lngMax: 107.7 };

function projectPin(lat: number, lng: number) {
  const left = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * 100;
  const top  = ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * 100;
  return { left, top };
}

function BranchMapPanel({
  list,
  canEdit,
  onEdit,
}: {
  list: Branch[];
  canEdit: boolean;
  onEdit: (b: Branch) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.id ?? null);
  const selected = list.find(b => b.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Map */}
      <div className="lg:col-span-2">
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
            <div className="text-xs font-medium text-gray-700 inline-flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-gray-500" />
              Geolocation preview — customer app
            </div>
            <div className="text-[11px] text-gray-400">
              {list.length} pin{list.length === 1 ? "" : "s"} · Cambodia
            </div>
          </div>

          {/* Stylised map canvas */}
          <div
            className="relative h-[360px] bg-gradient-to-br from-sky-50 via-emerald-50/60 to-amber-50/30"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            {/* Compass + scale */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-white/80 backdrop-blur-sm text-[10px] font-mono text-gray-600 shadow-sm border border-gray-200">
              N ↑
            </div>
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-white/80 backdrop-blur-sm text-[10px] text-gray-600 shadow-sm border border-gray-200">
              ~ 100 km
            </div>

            {/* Pins */}
            {list.map(b => {
              const pos = projectPin(b.lat, b.lng);
              const active = b.id === selectedId;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className="absolute -translate-x-1/2 -translate-y-full focus:outline-none group"
                  style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                  title={b.name}
                >
                  <div
                    className={cn(
                      "relative flex items-center justify-center transition-transform",
                      active ? "scale-125" : "group-hover:scale-110"
                    )}
                  >
                    {/* Pin teardrop */}
                    <svg
                      width="22"
                      height="28"
                      viewBox="0 0 22 28"
                      className="drop-shadow"
                    >
                      <path
                        d="M11 0c6.075 0 11 4.925 11 11 0 5.225-6.111 12.722-10.34 16.97a1 1 0 0 1-1.32 0C6.111 23.722 0 16.225 0 11 0 4.925 4.925 0 11 0Z"
                        className={cn(
                          active ? "fill-brand-600" : "fill-rose-500"
                        )}
                      />
                      <circle cx="11" cy="11" r="4" fill="white" />
                    </svg>
                  </div>
                  {/* Label on hover/active */}
                  <div
                    className={cn(
                      "absolute left-1/2 top-full -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md bg-white/95 border border-gray-200 shadow-sm text-[10px] font-medium text-gray-900 whitespace-nowrap transition",
                      active
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {b.name}
                  </div>
                </button>
              );
            })}

            {/* Empty state */}
            {list.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                No branches with geolocation yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Side panel */}
      <div>
        <Card className="!p-0">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-700">Branches</div>
          </div>
          <ul className="divide-y divide-gray-100 max-h-[316px] overflow-y-auto scrollbar-thin">
            {list.map(b => {
              const active = b.id === selectedId;
              return (
                <li key={b.id}>
                  <button
                    onClick={() => setSelectedId(b.id)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition",
                      active ? "bg-brand-50/60 border-l-2 border-brand-500" : "hover:bg-gray-50 border-l-2 border-transparent"
                    )}
                  >
                    <MapPin
                      className={cn(
                        "w-3.5 h-3.5 flex-shrink-0",
                        active ? "text-brand-600" : "text-rose-500"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        "text-sm truncate",
                        active ? "font-medium text-brand-700" : "text-gray-900"
                      )}>
                        {b.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">
                        {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selected && (
          <Card className="mt-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">
              Selected branch
            </div>
            <div className="text-sm font-semibold text-gray-900">{selected.name}</div>
            <div className="text-xs text-gray-600 mt-2 space-y-1.5">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <span>{selected.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span>{selected.phone}</span>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => onEdit(selected)}
                className="mt-3 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
              >
                <Pencil className="w-3 h-3" />
                Edit branch
              </button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- Branch editor modal ---------- */

function BranchEditorModal({
  initial,
  nextId,
  onClose,
  onSave,
}: {
  initial: Branch | null;
  nextId: string;
  onClose: () => void;
  onSave: (b: Branch) => void;
}) {
  const isEdit = !!initial;

  const [name, setName]       = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone]     = useState(initial?.phone ?? "+855 ");
  // Picked location (null until the user clicks on the map for a new branch).
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Other branches shown as light reference pins.
  const otherBranches = BRANCHES.filter(b => b.id !== initial?.id);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newLng =
      MAP_BOUNDS.lngMin + (x / rect.width) * (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin);
    const newLat =
      MAP_BOUNDS.latMax - (y / rect.height) * (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin);
    setPin({ lat: newLat, lng: newLng });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Branch name is required.");
    if (!address.trim()) return setError("Address is required.");
    if (!phone.trim()) return setError("Phone is required.");
    if (!pin) return setError("Click on the map to set the branch location.");

    const b: Branch = {
      id: initial?.id ?? nextId,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      lat: pin.lat,
      lng: pin.lng,
    };
    onSave(b);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit branch" : "Add branch"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {isEdit ? `Updating ${initial?.id}` : "Create a new branch record."}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700">Branch name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Phnom Penh — Central"
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Address *</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="#123, St. 271, Sangkat BKK1"
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Phone *</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+855 23 900 000"
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Location picker — replaces operating hours + lat/lng inputs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">Location on map *</label>
              {pin && (
                <button
                  type="button"
                  onClick={() => setPin(null)}
                  className="text-[11px] text-gray-500 hover:text-gray-900 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={handleMapClick}
              className="relative h-[230px] rounded-lg border border-gray-200 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 cursor-crosshair"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.12) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              {/* Reference pins for other branches (subtle) */}
              {otherBranches.map(b => {
                const pos = projectPin(b.lat, b.lng);
                return (
                  <div
                    key={b.id}
                    className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
                    style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                    title={b.name}
                  >
                    <svg width="16" height="20" viewBox="0 0 22 28" className="opacity-50">
                      <path
                        d="M11 0c6.075 0 11 4.925 11 11 0 5.225-6.111 12.722-10.34 16.97a1 1 0 0 1-1.32 0C6.111 23.722 0 16.225 0 11 0 4.925 4.925 0 11 0Z"
                        className="fill-brand-400"
                      />
                      <circle cx="11" cy="11" r="3.5" fill="white" />
                    </svg>
                  </div>
                );
              })}

              {/* This branch's pin (brand-blue, big) */}
              {pin && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
                  style={{
                    left: `${projectPin(pin.lat, pin.lng).left}%`,
                    top:  `${projectPin(pin.lat, pin.lng).top}%`,
                  }}
                >
                  <svg width="26" height="33" viewBox="0 0 22 28" className="drop-shadow-md">
                    <path
                      d="M11 0c6.075 0 11 4.925 11 11 0 5.225-6.111 12.722-10.34 16.97a1 1 0 0 1-1.32 0C6.111 23.722 0 16.225 0 11 0 4.925 4.925 0 11 0Z"
                      className="fill-brand-600"
                    />
                    <circle cx="11" cy="11" r="4" fill="white" />
                  </svg>
                </div>
              )}

              {/* Empty state hint */}
              {!pin && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="px-3 py-1.5 rounded-md bg-white/85 backdrop-blur-sm border border-gray-200 text-xs text-gray-600 shadow-sm inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    Click anywhere on the map to drop a pin
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-gray-500 mt-1.5 flex items-center justify-between">
              <span>Click on the map to set the branch location. Light pins are existing branches.</span>
              {pin && (
                <span className="font-mono text-gray-600">
                  {pin.lat.toFixed(4)}°, {pin.lng.toFixed(4)}°
                </span>
              )}
            </div>
          </div>
        </form>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <div className="text-[11px] text-gray-500">
            {isEdit ? "" : `Will be created as `}
            <span className="font-mono text-gray-700">{initial?.id ?? nextId}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              {isEdit ? "Save changes" : "Create branch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferralView() {
  const { can } = useRole();
  const readOnly = !can("setting.edit");

  /* Derive the CO codes table from the central USERS list — any user that has
   * a 5-char code on their profile shows up here. Inactive users render in a
   * disabled style so the operator can see why a code stopped working. */
  type CodeRow = {
    id: string;
    code: string;
    name: string;
    role: string;
    branch: string;
    referrals: number;
    applications: number;
    disbursed: number;
    disabled: boolean;
  };

  const CO_CODES: CodeRow[] = USERS.filter(u => !!u.code).map(u => ({
    id: u.id,
    code: u.code as string,
    name: u.name,
    role: u.role,
    branch: u.branch,
    referrals: u.referralStats?.referrals ?? 0,
    applications: u.referralStats?.applications ?? 0,
    disbursed: u.referralStats?.disbursed ?? 0,
    disabled: u.status !== "Active",
  }));

  return (
    <div className="space-y-5">
      <div>
        <H2>Referral Program</H2>
        <P>Customers enter a 5-digit Credit Officer code at signup. Track conversions per officer.</P>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile label="Active codes" value="14" delta="+2" />
        <StatTile label="Customers referred" value="287" delta="+24" />
        <StatTile label="Applications" value="173" delta="+18" />
      </div>

      {/* CO codes table */}
      <Card>
        <div className="mb-3">
          <div className="font-medium text-gray-900">Credit Officer codes</div>
          <div className="text-xs text-gray-500 mt-0.5">One unique 5-digit code per officer.</div>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50">
              <tr>
                {["Code", "Officer", "Branch", "Apps", "Disbursed"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CO_CODES.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    No referral codes assigned yet. Add a code to a user in Users & Roles → Add user.
                  </td>
                </tr>
              ) : (
                CO_CODES.map(r => (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-t border-gray-100",
                      r.disabled && "bg-gray-50/60 opacity-60"
                    )}
                    title={r.disabled ? "User is Inactive — referral code is disabled" : undefined}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-mono font-medium tracking-wider",
                            r.disabled
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          )}
                        >
                          {r.code}
                        </span>
                        <button
                          disabled={r.disabled}
                          className={cn(
                            r.disabled
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-400 hover:text-gray-700"
                          )}
                          aria-label={`Copy code ${r.code}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {r.disabled && <StatusBadge status="Inactive" />}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div
                        className={cn(
                          "font-medium",
                          r.disabled ? "text-gray-500" : "text-gray-900"
                        )}
                      >
                        {r.name}
                      </div>
                      <div className="text-xs text-gray-500">{r.role}</div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{r.branch}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.applications}</td>
                    <td
                      className={cn(
                        "px-4 py-2.5",
                        r.disabled ? "text-gray-500" : "font-medium text-gray-900"
                      )}
                    >
                      {r.disbursed}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
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

type PolicyDoc = {
  id: "terms" | "privacy" | "compliance";
  title: string;
  description: string;
  version: string;
  updated: string;
  status: "Published" | "Draft";
  body: string;
};

const POLICY_SEED: PolicyDoc[] = [
  {
    id: "terms",
    title: "Terms & Conditions",
    description: "Customer-facing terms shown at signup.",
    version: "v2.4",
    updated: "2026-01-15",
    status: "Published",
    body:
`# Terms & Conditions

_Last updated: January 15, 2026_

## 1. Acceptance of Terms
By creating an account or using WeLoan365, you agree to these Terms.

## 2. Eligibility
You must be at least 18 years old and a resident of Cambodia.

## 3. Loan Process
Applications are subject to credit assessment and approval.

## 4. Repayment
Loans must be repaid according to the agreed schedule.

## 5. Fees & Interest
See the Interest & Fees Disclosure shown at application time.

## 6. Contact
support@loanops.kh`,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description: "How customer data is collected, stored, and shared.",
    version: "v1.8",
    updated: "2025-11-02",
    status: "Published",
    body:
`# Privacy Policy

_Last updated: November 2, 2025_

## 1. Information We Collect
- Personal information (name, phone, national ID)
- Financial information (income, employment)
- App usage data

## 2. How We Use It
To assess loan eligibility, manage your account, and meet legal obligations.

## 3. Sharing
We may share with the National Bank of Cambodia and credit bureaus as required.

## 4. Your Rights
You can request access, correction, or deletion of your data at any time.`,
  },
  {
    id: "compliance",
    title: "Compliance Notices",
    description: "Regulatory disclosures shown in the customer app.",
    version: "v3.1",
    updated: "2026-02-20",
    status: "Published",
    body:
`# Compliance Notices

WeLoan365 operates in accordance with Cambodian financial regulations.

## NBC License
Operating under license NBC-MFI-00123.

## CBC Reporting
All loan data is reported to the Credit Bureau of Cambodia.

## AML / KYC
We comply with anti-money-laundering and know-your-customer requirements.

## Consumer Protection
You have the right to a fair grievance process. See the Customer Complaint Process for details.`,
  },
];

function PolicyView() {
  const { can } = useRole();
  const canEdit = can("setting.edit");
  const [policies, setPolicies] = useState<PolicyDoc[]>(POLICY_SEED);
  const [editingId, setEditingId] = useState<PolicyDoc["id"] | null>(null);

  const editing = editingId ? policies.find(p => p.id === editingId) ?? null : null;

  if (editing) {
    return (
      <PolicyEditor
        policy={editing}
        readOnly={!canEdit}
        onCancel={() => setEditingId(null)}
        onSave={updated => {
          setPolicies(prev => prev.map(p => (p.id === updated.id ? updated : p)));
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <H2>App Policy</H2>
        <P>Update the customer-facing legal and compliance content.</P>
      </div>
      <Card className="!p-0">
        <div className="divide-y divide-gray-100">
          {policies.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-medium text-gray-900">{p.title}</div>
                    <span
                      className={cn(
                        "text-[10px] font-medium rounded px-1.5 py-0.5",
                        p.status === "Published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {p.version} · Updated {p.updated}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingId(p.id)}
                className="text-xs text-brand-600 hover:bg-brand-50 font-medium inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md flex-shrink-0"
              >
                {canEdit ? "Edit" : "View"}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PolicyEditor({
  policy,
  readOnly,
  onCancel,
  onSave,
}: {
  policy: PolicyDoc;
  readOnly: boolean;
  onCancel: () => void;
  onSave: (p: PolicyDoc) => void;
}) {
  const [title, setTitle] = useState(policy.title);
  const [version, setVersion] = useState(policy.version);
  const [body, setBody] = useState(policy.body);
  const [status, setStatus] = useState<PolicyDoc["status"]>(policy.status);
  const [preview, setPreview] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const changed =
    title !== policy.title ||
    version !== policy.version ||
    body !== policy.body ||
    status !== policy.status;

  const save = () => {
    onSave({ ...policy, title: title.trim() || policy.title, version: version.trim() || policy.version, body, status, updated: today });
  };

  return (
    <div className="space-y-4">
      {/* Top nav */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onCancel}
          className="text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to App Policy
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreview(p => !p)}
            className={cn(
              "text-xs font-medium inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border",
              preview
                ? "bg-brand-50 text-brand-700 border-brand-200"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            {preview ? "Editing" : "Preview"}
          </button>
          {!readOnly && (
            <>
              <button
                onClick={onCancel}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!changed}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div>
        <H2>{readOnly ? "View" : "Edit"} {policy.title}</H2>
        <P>
          Customer-facing content. Changes apply to the app once you publish.
        </P>
      </div>

      {/* Meta */}
      <Card>
        <div className="font-medium text-gray-900 mb-3">Document settings</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              readOnly={readOnly}
              className={cn(
                "mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
                readOnly && "bg-gray-50 text-gray-700"
              )}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Version</label>
            <input
              value={version}
              onChange={e => setVersion(e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. v2.5"
              className={cn(
                "mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
                readOnly && "bg-gray-50 text-gray-700"
              )}
            />
            <div className="text-[11px] text-gray-500 mt-1 inline-flex items-center gap-1">
              <History className="w-3 h-3" />
              Previously {policy.version} · {policy.updated}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Status</label>
            <div className="mt-1 flex gap-2">
              {(["Draft", "Published"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-md border transition disabled:opacity-60 disabled:cursor-not-allowed",
                    status === s
                      ? s === "Published"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30"
                        : "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Content editor / preview */}
      <Card className="!p-0">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-medium text-gray-900">Content</div>
          <div className="text-[11px] text-gray-500">
            Markdown-style · {body.length} characters
          </div>
        </div>
        {preview ? (
          <div className="px-5 py-4 prose prose-sm max-w-none text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
            {body}
          </div>
        ) : (
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            readOnly={readOnly}
            spellCheck
            className={cn(
              "w-full px-5 py-4 text-sm font-mono leading-relaxed focus:outline-none resize-none rounded-b-xl min-h-[280px]",
              readOnly && "bg-gray-50 text-gray-700"
            )}
            rows={14}
          />
        )}
      </Card>

      {/* Footer save */}
      {!readOnly && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-xs text-gray-500">
            {changed ? "You have unsaved changes." : "All changes saved."}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancel}
              className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!changed}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save changes
            </button>
          </div>
        </div>
      )}
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

/* ---------- Customer update alert block (lives in Customer app version card) ---------- */

function CustomerUpdateAlert({ ready }: { ready: boolean }) {
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  const alertCustomers = () => {
    if (sending || sent || !ready) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      // Auto-reset so the demo can be re-triggered
      setTimeout(() => setSent(false), 2800);
    }, 1100);
  };

  if (sent) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-gray-900">Alert sent to customers</div>
            <div className="text-[11px] text-gray-600 mt-0.5">
              A push notification was queued for customers to update their app.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-gray-900">
            Please alert customer to update the mobile app
          </div>
          <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
            {ready
              ? "Please update your mobile app to have the best experience"
              : "Save the version changes to enable alerting."}
          </div>
        </div>
        <button
          onClick={alertCustomers}
          disabled={sending || !ready}
          className={cn(
            "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium whitespace-nowrap",
            !ready
              ? "bg-amber-200/50 text-amber-800/50 cursor-not-allowed"
              : sending
              ? "bg-amber-200 text-amber-800 cursor-wait"
              : "bg-amber-600 text-white hover:bg-amber-700"
          )}
        >
          {sending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Alerting…
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Alert now
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ====================================================================
   Birthday Notification view
   ==================================================================== */

const BIRTHDAY_UPCOMING = [
  { name: "Sokha Chan", date: "Apr 23 (in 2 days)", age: 31, status: "Scheduled" },
  { name: "Dara Meas",  date: "Apr 25 (in 4 days)", age: 42, status: "Scheduled" },
  { name: "Pisey Ros",  date: "Apr 28 (in 7 days)", age: 27, status: "Draft" },
];

const DEFAULT_BIRTHDAY_TEMPLATE = {
  title: "Happy Birthday, {{name}}!",
  body:
    "Wishing you a wonderful year ahead filled with happiness, good health, " +
    "and success. Thank you for being part of the WeLoan365 family.",
};

function BirthdayView() {
  const [template, setTemplate] = useState(DEFAULT_BIRTHDAY_TEMPLATE);
  const [autoSend, setAutoSend] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <H2>Birthday Notification</H2>
        <P>Automated happy-birthday messages sent to customers on their birthday.</P>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 !p-0">
          <div className="px-5 py-3 border-b border-gray-200">
            <div className="font-medium text-gray-900 text-sm">Upcoming — next 7 day</div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Customer", "Birthday", "Turning", "Status"].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BIRTHDAY_UPCOMING.map(u => (
                <tr key={u.name} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-2.5 text-gray-700">{u.date}</td>
                  <td className="px-4 py-2.5 text-gray-700">{u.age}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        <Card>
          <div className="font-medium text-gray-900 text-sm">Message template</div>
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mt-3">
            <Cake className="w-5 h-5 text-pink-500 mb-1.5" />
            <div className="font-medium text-gray-900 text-sm">{template.title}</div>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
              {template.body}
            </p>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="mt-3 w-full py-2 text-xs border border-gray-200 rounded-md hover:bg-gray-50 inline-flex items-center justify-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-500" />
            Edit template
          </button>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 inline-flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-brand-600" />
                Auto send
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Deliver automatically on the customer&apos;s birthday.
              </div>
            </div>
            <label className="inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={autoSend}
                onChange={e => setAutoSend(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-checked:bg-brand-600 rounded-full relative transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 peer-checked:after:translate-x-5 after:transition" />
            </label>
          </div>
        </Card>
      </div>

      <BirthdayEditTemplateModal
        open={editOpen}
        initial={template}
        onClose={() => setEditOpen(false)}
        onSave={next => {
          setTemplate(next);
          setEditOpen(false);
        }}
        onReset={() => setTemplate(DEFAULT_BIRTHDAY_TEMPLATE)}
      />
    </div>
  );
}

function BirthdayEditTemplateModal({
  open,
  initial,
  onClose,
  onSave,
  onReset,
}: {
  open: boolean;
  initial: { title: string; body: string };
  onClose: () => void;
  onSave: (next: { title: string; body: string }) => void;
  onReset: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [body, setBody]   = useState(initial.body);

  useEffect(() => {
    if (open) {
      setTitle(initial.title);
      setBody(initial.body);
    }
  }, [open, initial.title, initial.body]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isDirty = title !== initial.title || body !== initial.body;
  const canSave = title.trim().length > 0 && body.trim().length > 0;
  const previewTitle = title.replace(/\{\{\s*name\s*\}\}/g, "Sokha Chan");
  const previewBody  = body.replace(/\{\{\s*name\s*\}\}/g, "Sokha Chan");

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900">Edit message template</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Customise the birthday wish. Use{" "}
              <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">{"{{name}}"}</code>{" "}
              to insert the customer&apos;s first name.
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Happy Birthday, {{name}}!"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Message body</label>
                <span className={cn(
                  "text-[11px]",
                  body.length > 240 ? "text-red-600" : "text-gray-400"
                )}>
                  {body.length} / 240
                </span>
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                maxLength={240}
                placeholder="Wishing you a wonderful year ahead…"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Preview</label>
            <div className="mt-1 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <Cake className="w-6 h-6 text-pink-500 mb-2" />
              <div className="font-medium text-gray-900">
                {previewTitle || <span className="text-gray-400 italic">Title preview…</span>}
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                {previewBody || <span className="text-gray-400 italic">Message preview…</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to default
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave({ title, body })}
              disabled={!isDirty || !canSave}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md",
                isDirty && canSave
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
