"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  X,
  MessageCircle,
  FileText,
  Eye,
  Info,
  Plus,
  Download,
  Banknote,
  Lock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ClipboardCheck,
  FileSearch,
  ShieldCheck,
  UserCheck,
  Search,
  Phone,
} from "lucide-react";
import { APPLICATIONS, CUSTOMERS, USERS, PRODUCTS, type Application, type ApplicationStatus } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";

type TabDef = { key: TabKey; label: string; permission?: string };

const TABS: TabDef[] = [
  { key: "status",      label: "Loan Status" },
  { key: "kyc",         label: "KYC / Documents",           permission: "customer.view" },
  { key: "guarantor",   label: "Guarantor info",            permission: "customer.view" },
  { key: "repayment",   label: "Repayment & Collection",    permission: "payment.view" },
  { key: "reminders",   label: "Reminders / Notifications" },
  { key: "audit",       label: "Audit Log",                 permission: "audit.view" },
  { key: "reports",     label: "Reports & Analytics",       permission: "report.view" },
  { key: "officer",     label: "Person in Charge" },
  { key: "restructure", label: "Re-structure" },
];

type TabKey =
  | "status"
  | "kyc"
  | "guarantor"
  | "repayment"
  | "reminders"
  | "audit"
  | "reports"
  | "officer"
  | "restructure";

/** NON-MWL = any product outside the MWL family and not the Staff Loan.
 *  The three product types (NON-MWL / MWL / Staff) show different detail data. */
function isNonMwlProduct(productName: string): boolean {
  const p = PRODUCTS.find(x => x.name === productName);
  const isMwl = p?.kind === "mwl-parent" || p?.kind === "mwl-sub";
  return !isMwl && productName !== "Staff Loan";
}

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const a = APPLICATIONS.find(x => x.id === params.id);
  if (!a) return notFound();

  const { role, can, canApprove } = useRole();

  const visibleTabs = useMemo(
    () =>
      TABS.filter(t => {
        // Re-structure is only meaningful once the loan has been approved.
        if (t.key === "restructure" && a.status !== "Approved") return false;
        // Repayment and its reminders are only meaningful once a loan exists —
        // hide while in Progress (and also on rejected loans, see below).
        if ((t.key === "repayment" || t.key === "reminders") && a.status === "Progress") return false;
        // NON-MWL applications in progress have no guarantor step at all.
        if (t.key === "guarantor" && a.status === "Progress" && isNonMwlProduct(a.product)) return false;
        // For rejected loans, only surface the tabs relevant to the rejection record.
        if (a.status === "Rejected") {
          const REJECTED_TABS: TabKey[] = ["status", "kyc", "audit", "officer"];
          if (!REJECTED_TABS.includes(t.key)) return false;
        }
        return !t.permission || can(t.permission);
      }),
    [can, a.status]
  );

  const [tab, setTab] = useState<TabKey>("status");
  const [rejectOpen, setRejectOpen] = useState(false);
  // Keep the active tab valid when the role changes.
  useEffect(() => {
    if (!visibleTabs.some(t => t.key === tab)) {
      setTab(visibleTabs[0]?.key ?? "status");
    }
  }, [visibleTabs, tab]);

  // ----- Workflow stage helpers -----
  const inProgressStage = a.status === "Progress";

  // ----- Action button gates: combine permission + workflow status -----
  const mayRequestInfo = can("loan.review")  && inProgressStage;
  const mayReject      = can("loan.reject")  && inProgressStage;
  const mayApprove     = can("loan.approve") && inProgressStage;
  const mayApproveAmt  = canApprove(a.amount); // amount within approval limit
  const mayDisburse    = false;                // disbursement removed from workflow
  const mayReopen      = role.key === "admin" && a.status === "Rejected"; // admin override
  const mayUnreject    = false;                // no Disbursed status to reverse

  // Tell the user *why* approve is blocked (no perm vs amount over limit)
  const approveBlockedReason =
    !can("loan.approve")
      ? "This role cannot approve loan applications."
      : role.approvalLimit !== null && a.amount > role.approvalLimit
      ? `Above your approval limit of $${role.approvalLimit.toLocaleString()}. Will route to a higher-tier approver.`
      : null;

  // No view permission at all → block the page
  if (!can("loan.view")) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl border border-gray-200 p-10 text-center shadow-card">
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">No access</h2>
        <p className="text-sm text-gray-500 mt-1">
          The <span className="font-medium">{role.name}</span> role cannot view loan applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <Link
        href="/customer/applications"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to applications
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-6 py-5 border-b border-gray-200">
          <div>
            <div className="text-xs font-mono text-gray-500">{a.id}</div>
            <div className="text-xl font-semibold text-gray-900">{a.name}</div>
            <div className="text-sm text-gray-500">
              {a.product} • ${a.amount.toLocaleString()} • {a.term}m
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={a.status} />

            {mayRequestInfo && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                Request info
              </button>
            )}

            {mayReject && (
              <button
                onClick={() => setRejectOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            )}

            {mayDisburse && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium">
                <Banknote className="w-4 h-4" />
                Disburse
              </button>
            )}

            {mayApprove && (
              <button
                disabled={!mayApproveAmt}
                title={approveBlockedReason ?? ""}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium",
                  mayApproveAmt
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept
              </button>
            )}

            {/* Admin overrides */}
            {mayReopen && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-amber-200 text-amber-700 rounded-md hover:bg-amber-50">
                <RotateCcw className="w-4 h-4" />
                Reopen
              </button>
            )}
            {mayUnreject && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-amber-200 text-amber-700 rounded-md hover:bg-amber-50">
                <RotateCcw className="w-4 h-4" />
                Reverse disbursement
              </button>
            )}

            {/* Stage-locked hint when role can't act on this status */}
            {!mayRequestInfo && !mayReject && !mayDisburse && !mayApprove && !mayReopen && !mayUnreject && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
                <Lock className="w-3 h-3" />
                No action available at this stage
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 flex gap-1 overflow-x-auto">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "whitespace-nowrap px-3 py-3 text-sm border-b-2 -mb-px",
                tab === t.key
                  ? "border-brand-600 text-brand-700 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === "status"    && <LoanStatusTab a={a} />}
          {tab === "kyc"       && <KycTab a={a} />}
          {tab === "guarantor" && <GuarantorTab a={a} />}
          {tab === "repayment" && <RepaymentTab a={a} />}
          {tab === "reminders" && <RemindersTab a={a} />}
          {tab === "audit"     && <AuditTab a={a} />}
          {tab === "reports"     && <ReportsTab a={a} />}
          {tab === "officer"     && <OfficerTab a={a} />}
          {tab === "restructure" && <RestructureTab a={a} />}
        </div>
      </div>

      <RejectReasonModal
        open={rejectOpen}
        customerName={a.name}
        onClose={() => setRejectOpen(false)}
        onSubmit={reason => {
          // Mock send — real app would call an API to reject + notify.
          console.log("Reject:", a.id, { reason });
          setRejectOpen(false);
        }}
      />
    </div>
  );
}

/* ---------- shared bits ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
      {children}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center py-2">
      <dt className="text-gray-500 text-sm">{label}</dt>
      <dd className="text-gray-900 text-sm">{value}</dd>
    </div>
  );
}

/* ---------- workflow stages (Submission → Document Review → Credit Check → Approval) ---------- */

type Stage = "Submission" | "Review" | "CreditCheck" | "Approval";

type StageState = "done" | "active" | "pending" | "failed";

type StageInfo = {
  key: Stage;
  label: string;
  role: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  state: StageState;
  who?: string;
  when?: string;
};

function getStages(status: ApplicationStatus): StageInfo[] {
  // Stage 1 — Submission (always done if the app exists)
  const SUBMISSION: StageInfo = {
    key: "Submission",
    label: "Submission",
    role: "Credit Officer",
    description: "CO submits the application on behalf of the customer.",
    icon: ClipboardCheck,
    state: "done",
    who: "Visal P.",
    when: "Apr 20",
  };
  // Stage 2 — Document Review (KYC + uploaded docs)
  const REVIEW: StageInfo = {
    key: "Review",
    label: "Document Review",
    role: "Credit Officer",
    description: "Verify KYC, national ID, and supporting documents.",
    icon: FileSearch,
    state: "pending",
  };
  // Stage 3 — Credit Check (CBC pull, risk scoring)
  const CREDIT_CHECK: StageInfo = {
    key: "CreditCheck",
    label: "Credit Check",
    role: "Senior Credit Officer",
    description: "Pull CBC report, score risk, evaluate debt-to-income.",
    icon: ShieldCheck,
    state: "pending",
  };
  // Stage 4 — Approval (final approval decision)
  const APPROVAL: StageInfo = {
    key: "Approval",
    label: "Approval",
    role: "Approval Committee / BM",
    description: "Final approval decision, within the role's limit.",
    icon: UserCheck,
    state: "pending",
  };

  if (status === "Progress") {
    REVIEW.state = "done";
    REVIEW.who = "Visal P.";
    REVIEW.when = "Apr 20";
    CREDIT_CHECK.state = "active";
  } else if (status === "Approved") {
    REVIEW.state = "done";
    REVIEW.who = "Visal P.";
    REVIEW.when = "Apr 20";
    CREDIT_CHECK.state = "done";
    CREDIT_CHECK.who = "System / Sophea K.";
    CREDIT_CHECK.when = "Apr 21";
    APPROVAL.state = "done";
    APPROVAL.who = "Sophea K.";
    APPROVAL.when = "Apr 21";
  } else if (status === "Rejected") {
    // Rejected at Document Review — surface that stage in red and leave
    // the downstream stages as "pending" (they never happened).
    REVIEW.state = "failed";
    REVIEW.who = "Visal P.";
    REVIEW.when = "Apr 20";
    // CREDIT_CHECK and APPROVAL stay in their default "pending" state.
  }
  return [SUBMISSION, REVIEW, CREDIT_CHECK, APPROVAL];
}

/* ---------- tab: Loan Status ---------- */

function LoanStatusTab({ a }: { a: Application }) {
  const stages = useMemo(() => getStages(a.status), [a.status]);
  const monthly = Math.round((a.amount * (1 + a.rate / 100)) / a.term);
  const total   = Math.round(a.amount * (1 + a.rate / 100));

  // ----- Carousel (3 visible, 1 hidden) -----
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    return () => {
      el.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, []);

  const cardStep = () => {
    const el = scrollRef.current;
    if (!el) return 0;
    return el.scrollWidth / stages.length;
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -cardStep() : cardStep(),
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>
          Approval workflow — Submission → Approval (4 steps)
        </SectionLabel>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            disabled={!canLeft}
            className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canRight}
            className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel — 3 cards visible, 1 hidden. Scrollable horizontally. */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scroll-smooth pb-1"
      >
        <div className="grid grid-flow-col gap-3 [grid-auto-columns:88%] sm:[grid-auto-columns:calc((100%_-_24px)/3)]">
          {stages.map((s, i) => (
            <StageCard key={s.key} stage={s} index={i + 1} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <Box label="Requested amount" value={`$${a.amount.toLocaleString()}`} />
        <Box label="Monthly payment" value={`$${monthly.toLocaleString()}`} />
        <Box label="Total repayable" value={`$${total.toLocaleString()}`} />
      </div>
    </>
  );
}

function StageCard({ stage, index }: { stage: StageInfo; index: number }) {
  const stateStyles: Record<StageState, { ring: string; pillBg: string; pillText: string; iconBg: string; iconText: string; statusLabel: string; statusCls: string }> = {
    done: {
      ring: "border-emerald-200 bg-white",
      pillBg: "bg-emerald-100",
      pillText: "text-emerald-800",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-700",
      statusLabel: "Done",
      statusCls: "text-emerald-700 bg-emerald-50",
    },
    active: {
      ring: "border-brand-300 bg-brand-50/40 ring-2 ring-brand-100",
      pillBg: "bg-brand-100",
      pillText: "text-brand-800",
      iconBg: "bg-brand-100",
      iconText: "text-brand-700",
      statusLabel: "In progress",
      statusCls: "text-brand-700 bg-brand-50",
    },
    pending: {
      ring: "border-gray-200 bg-white",
      pillBg: "bg-gray-100",
      pillText: "text-gray-500",
      iconBg: "bg-gray-100",
      iconText: "text-gray-400",
      statusLabel: "Pending",
      statusCls: "text-gray-500 bg-gray-100",
    },
    failed: {
      ring: "border-red-200 bg-white",
      pillBg: "bg-red-100",
      pillText: "text-red-800",
      iconBg: "bg-red-100",
      iconText: "text-red-700",
      statusLabel: "Rejected",
      statusCls: "text-red-700 bg-red-50",
    },
  };
  const s = stateStyles[stage.state];
  const Icon = stage.icon;
  return (
    <div className={cn("flex-1 rounded-lg border p-4", s.ring)}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold", s.pillBg, s.pillText)}>
          {index}
        </span>
        <span className={cn("text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded", s.statusCls)}>
          {s.statusLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", s.iconBg)}>
          <Icon className={cn("w-4 h-4", s.iconText)} />
        </div>
        <div className="font-medium text-gray-900 text-sm">{stage.label}</div>
      </div>
      <div className="text-[11px] text-gray-500 leading-snug">{stage.description}</div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Owner</div>
        <div className="text-xs text-gray-700">{stage.role}</div>
        {stage.who && (
          <div className="text-[11px] text-gray-500 mt-0.5">
            By {stage.who} · {stage.when}
          </div>
        )}
      </div>
    </div>
  );
}

function Box({ label, value, tone }: { label: string; value: string; tone?: "green" | "amber" }) {
  const cls =
    tone === "green" ? "bg-emerald-50 border-emerald-100"
    : tone === "amber" ? "bg-amber-50 border-amber-100"
    : "bg-gray-50 border-gray-200";
  return (
    <div className={cn("p-4 rounded-lg border", cls)}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

/* ---------- tab: KYC / Documents ---------- */

type KycDoc = { name: string; status: "verified" | "pending"; image: string };

/** Inline SVG placeholder standing in for a scanned/photographed upload, so the
 *  preview + download flow works without real image assets in the prototype. */
function docPlaceholder(label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='520' viewBox='0 0 800 520'>
    <rect width='800' height='520' fill='#f1f5f9'/>
    <rect x='40' y='40' width='720' height='440' rx='16' fill='#ffffff' stroke='#cbd5e1' stroke-width='2'/>
    <rect x='80' y='90' width='180' height='180' rx='12' fill='#e2e8f0'/>
    <rect x='300' y='100' width='380' height='28' rx='6' fill='#e2e8f0'/>
    <rect x='300' y='154' width='300' height='20' rx='6' fill='#eef2f7'/>
    <rect x='300' y='196' width='340' height='20' rx='6' fill='#eef2f7'/>
    <rect x='80' y='320' width='600' height='20' rx='6' fill='#eef2f7'/>
    <rect x='80' y='360' width='520' height='20' rx='6' fill='#eef2f7'/>
    <text x='400' y='452' font-family='sans-serif' font-size='28' fill='#94a3b8' text-anchor='middle'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Compact document card — icon, name, preview. Shared by every "Uploaded
 *  documents" list on this page (KYC docs, MWL docs, guarantor docs, and
 *  signed contracts) so they read as one consistent design. */
function DocCard({ doc, onOpen }: { doc: KycDoc; onOpen: (d: KycDoc) => void }) {
  return (
    <button
      onClick={() => onOpen(doc)}
      className="group text-left border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:border-brand-300 hover:bg-gray-50 transition"
    >
      <span className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0 text-sm font-semibold text-gray-900 truncate">
        {doc.name}
      </div>
      <Eye className="w-4 h-4 text-gray-300 group-hover:text-brand-600 flex-shrink-0" />
    </button>
  );
}

function KycTab({ a }: { a: Application }) {
  // Pull personal information from the linked customer record so the customer
  // detail page and this loan application detail always show the same data.
  const customer = CUSTOMERS.find(c => c.id === a.cid);
  // The loan product the customer applied for (for its name + allowed range).
  const product = PRODUCTS.find(p => p.name === a.product);
  // Product type — the personal-information rows differ per type
  // (NON-MWL / MWL / Staff). The Staff layout is still to be specced.
  const isNonMwl = isNonMwlProduct(a.product);
  const isMwl = product?.kind === "mwl-parent" || product?.kind === "mwl-sub";
  // Loan-request figures for the NON-MWL layout. `a.rate` is % APR — the
  // customer app shows the monthly rate and an amortized monthly installment.
  const monthlyRatePct = a.rate / 12;
  const r = monthlyRatePct / 100;
  const estMonthly = (a.amount * r) / (1 - Math.pow(1 + r, -a.term));
  const tenureYears = a.term / 12;
  const tenureLabel = `${a.term} months · ${
    Number.isInteger(tenureYears) ? tenureYears : tenureYears.toFixed(1)
  } ${tenureYears === 1 ? "yr" : "yrs"}`;
  // MWL loan-request figures — flat monthly interest with an interest-only
  // period before departure, then equal installments for the remaining term.
  const interestOnlyMonths = 3;
  const mwlTotalRepayable = a.amount + a.amount * r * a.term;
  const mwlInterestOnlyPay = a.amount * r;
  const mwlRegularPay =
    (mwlTotalRepayable - interestOnlyMonths * mwlInterestOnlyPay) /
    (a.term - interestOnlyMonths);
  const destFlag =
    { "South Korea": "🇰🇷", Korea: "🇰🇷", Japan: "🇯🇵", Singapore: "🇸🇬" }[
      a.destination ?? ""
    ] ?? "";
  // Documents the customer uploads through the mobile KYC form, per type, at
  // the Progress stage. NON-MWL applications have not uploaded anything yet;
  // MWL applications submit two documents pre-departure; Staff applications
  // submit the standard KYC set.
  const nonMwlKycDocs: KycDoc[] = [];
  const mwlKycDocs: KycDoc[] = [
    { name: "National ID - Front",       status: "verified", image: docPlaceholder("National ID - Front") },
    { name: "Family / Residential Book", status: "verified", image: docPlaceholder("Family / Residential Book") },
  ];
  const staffKycDocs: KycDoc[] = [
    { name: "National ID",             status: "verified", image: docPlaceholder("National ID") },
    { name: "Selfie with National ID", status: "verified", image: docPlaceholder("Selfie with National ID") },
    { name: "Family book",             status: "verified", image: docPlaceholder("Family Book") },
  ];
  // Approved loans additionally surface the signed loan paperwork — mirrors
  // the customer app's document list. Each type gets its own contract set.
  const nonMwlContractDocs: KycDoc[] = [
    "Payment Schedule",
    "Loan Contract",
    "1st Restructured Contract",
    "Hypothec Contract",
    "Guarantee Contract",
  ].map(name => ({ name, status: "verified", image: docPlaceholder(name) }));
  const mwlContractDocs: KycDoc[] = [
    "Payment Schedule",
    "Loan Contract",
    "Guarantee Contract",
  ].map(name => ({ name, status: "verified", image: docPlaceholder(name) }));
  // Split so the UI can label which documents came from the application
  // itself (Progress) vs. which were added once the loan was Approved —
  // Approved never discards the Progress uploads, it only adds to them.
  const progressDocs: KycDoc[] = isNonMwl ? nonMwlKycDocs : isMwl ? mwlKycDocs : staffKycDocs;
  const approvedOnlyDocs: KycDoc[] =
    a.status !== "Approved"
      ? []
      : isNonMwl
      ? nonMwlContractDocs
      : isMwl
      ? mwlContractDocs
      : []; // Staff has no separate contract set yet.
  const [preview, setPreview] = useState<KycDoc | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <SectionLabel>Personal information</SectionLabel>
          <dl className="divide-y divide-gray-100">
            {isNonMwl ? (
              /* NON-MWL — compact summary matching the mobile app design. */
              <>
                <Row label="Product" value={a.product} />
                <Row label="Borrower" value={customer?.name ?? a.name} />
                {/* Co-borrower is committed at approval time. */}
                {a.status === "Approved" && (
                  <Row label="Co-Borrower" value="Malis Chan" />
                )}
                <Row label="Phone" value={<span className="font-mono text-xs">{customer?.phone ?? "—"}</span>} />
                <Row label="Branch" value={a.branch} />
              </>
            ) : isMwl ? (
              /* MWL — pre-departure summary, per the customer app. Same rows
                 for both Progress and Approved. */
              <>
                <Row
                  label="Destination"
                  value={
                    a.destination ? (
                      <span className="inline-flex items-center gap-1.5">
                        {destFlag && <span>{destFlag}</span>}
                        {a.destination}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <Row label="Loan Request" value={`USD ${a.amount.toLocaleString()}`} />
                <Row label="Borrower" value={customer?.name ?? a.name} />
                <Row label="Marital Status" value={customer?.maritalStatus ?? "—"} />
                <Row label="Phone" value={<span className="font-mono text-xs">{customer?.phone ?? "—"}</span>} />
                <Row label="Branch" value={a.branch} />
              </>
            ) : (
              /* Staff — full KYC rows (layout still to be specced). */
              <>
                <Row label="Full name" value={customer?.name ?? a.name} />
                <Row label="Phone" value={<span className="font-mono text-xs">{customer?.phone ?? "—"}</span>} />
                <Row label="City" value={customer?.profile.address.cityProvince ?? "—"} />
                <Row label="Current occupation" value={customer?.occupation ?? "—"} />
                <Row label="Marital status" value={customer?.maritalStatus ?? "—"} />
                <Row label="Select branch" value={a.branch} />
              </>
            )}
          </dl>
        </div>
        <div>
          {/* Loan request — what the customer applied for */}
          <SectionLabel>Loan request</SectionLabel>
          <dl className="divide-y divide-gray-100">
            {isNonMwl ? (
              /* NON-MWL — mirrors the customer app's loan-request summary. */
              <>
                <Row label="Currency" value="USD" />
                <Row
                  label="Requested Amount"
                  value={
                    <span className="font-semibold text-gray-900">
                      ${a.amount.toLocaleString()}
                    </span>
                  }
                />
                <Row label="Interest Rate" value={`${monthlyRatePct.toFixed(2)}% / mo`} />
                <Row label="Loan Tenure" value={tenureLabel} />
                <Row
                  label="Est. Monthly"
                  value={
                    <span className="font-semibold text-brand-600">
                      ${estMonthly.toFixed(2)}
                    </span>
                  }
                />
              </>
            ) : isMwl ? (
              /* MWL — interest-only repayment breakdown. Same rows for both
                 Progress and Approved. */
              <>
                <Row label="Currency" value="USD" />
                <Row label="Interest Rate" value={`${monthlyRatePct.toFixed(2)}% / month`} />
                <Row label="Tenure" value={`${a.term} months`} />
                <Row label="Interest-only" value={`${interestOnlyMonths} months`} />
                <Row label="Est. interest-only" value={`$${mwlInterestOnlyPay.toFixed(2)} / mo`} />
                <Row label="Est. regular" value={`$${mwlRegularPay.toFixed(2)} / mo`} />
                <Row
                  label="Total repayable"
                  value={
                    <span className="font-semibold text-gray-900">
                      ${mwlTotalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  }
                />
              </>
            ) : (
              /* Staff — existing rows (layout still to be specced). */
              <>
                <Row label="Loan product" value={a.product} />
                <Row
                  label="Request amount"
                  value={
                    <span className="inline-flex items-baseline gap-1.5">
                      <span className="font-semibold text-gray-900">
                        ${a.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400">USD</span>
                    </span>
                  }
                />
                {product && (
                  <Row
                    label="Allowed range"
                    value={`$${product.min.toLocaleString()} – $${product.max.toLocaleString()}`}
                  />
                )}
              </>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel>Uploaded documents</SectionLabel>
        {progressDocs.length === 0 && approvedOnlyDocs.length === 0 ? (
          /* NON-MWL in progress — nothing uploaded yet. */
          <div className="h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
            No documents uploaded yet
          </div>
        ) : (
          <div className="space-y-5">
            {progressDocs.length > 0 && (
              <div>
                {/* Remark: which stage these documents came from. */}
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Application documents
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {progressDocs.map(d => (
                    <DocCard key={d.name} doc={d} onOpen={setPreview} />
                  ))}
                </div>
              </div>
            )}
            {approvedOnlyDocs.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Loan documents
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {approvedOnlyDocs.map(d => (
                    <DocCard key={d.name} doc={d} onOpen={setPreview} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-image preview + download */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{preview.name}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={preview.image}
                  download={`${preview.name}.svg`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  Download
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 flex items-center justify-center">
              <img
                src={preview.image}
                alt={preview.name}
                className="max-w-full max-h-[70vh] rounded-md shadow-sm bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- tab: Guarantor info ---------- */

function GuarantorTab({ a }: { a: Application }) {
  // Mock guarantor — would come from the application record in production.
  const guarantor = {
    name: "Krong Kampuchea",
    phone: "+855 012 482 991",
    relationship: "Spouse (1st)",
  };

  const initials = guarantor.name.split(" ").map(s => s[0]).join("");

  // MWL applications in progress collect the guarantor's National ID
  // alongside the borrower's own documents (see KycTab).
  const product = PRODUCTS.find(p => p.name === a.product);
  const isMwl = product?.kind === "mwl-parent" || product?.kind === "mwl-sub";
  const showGuarantorDocs = isMwl && a.status === "Progress";
  const guarantorDoc: KycDoc = {
    name: "National ID",
    status: "verified",
    image: docPlaceholder("Guarantor National ID"),
  };
  const [preview, setPreview] = useState<KycDoc | null>(null);

  return (
    <div>
      {/* Guarantor personal info */}
      <div>
        <SectionLabel>Guarantor — personal info</SectionLabel>
        <div className="border border-gray-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gray-200 text-gray-700 text-sm font-semibold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">{guarantor.name}</div>
            <div className="text-xs text-gray-500 inline-flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />
              {guarantor.phone}
            </div>
          </div>
        </div>
        <dl className="divide-y divide-gray-100">
          <Row label="Relationship" value={guarantor.relationship} />
          <Row label="Guarantee for" value={<span className="font-medium text-gray-700">{a.name}</span>} />
        </dl>
      </div>

      {showGuarantorDocs && (
        <div className="mt-8">
          <SectionLabel>Uploaded documents</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DocCard doc={guarantorDoc} onOpen={setPreview} />
          </div>
        </div>
      )}

      {/* Full-image preview + download */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{preview.name}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={preview.image}
                  download={`${preview.name}.svg`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  Download
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 flex items-center justify-center">
              <img
                src={preview.image}
                alt={preview.name}
                className="max-w-full max-h-[70vh] rounded-md shadow-sm bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- tab: Repayment & Collection ---------- */

function RepaymentTab({ a }: { a: Application }) {
  // Build a simple schedule
  const monthly = (a.amount * (1 + a.rate / 100)) / a.term;
  const schedule = Array.from({ length: a.term }).map((_, i) => {
    const due = new Date("2026-05-01");
    due.setMonth(due.getMonth() + i);
    const principal = 200 + i * 2;
    const interest  = 24 - i * 1.5;
    const status =
      i < 2 ? "Posted" :
      i === 2 ? "Pending" :
      "Scheduled";
    return {
      n: i + 1,
      due: due.toISOString().slice(0, 10),
      principal,
      interest,
      total: principal + interest,
      status,
    };
  });

  const paid = monthly * 2;
  const outstanding = a.amount - paid;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Box label="Paid to date" value={`$${Math.round(paid).toLocaleString()}`} tone="green" />
        <Box label="Outstanding" value={`$${Math.round(outstanding).toLocaleString()}`} />
        <Box label="Next due" value="May 1" tone="amber" />
      </div>

      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              {["#", "Due date", "Principal", "Interest", "Total", "Status"].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "text-left px-4 py-2.5 text-[12px] font-medium text-gray-500",
                    i >= 2 && i <= 4 && "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.slice(0, 8).map(r => (
              <tr key={r.n} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-500">{r.n}</td>
                <td className="px-4 py-3 text-gray-700">{r.due}</td>
                <td className="px-4 py-3 text-gray-700 text-right">${r.principal.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-700 text-right">${r.interest.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-900 font-medium text-right">${r.total.toFixed(2)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
          <Download className="w-4 h-4 text-gray-500" />
          Download schedule
        </button>
      </div>
    </>
  );
}

/* ---------- tab: Reminders ---------- */

type Reminder = { date: string; msg: string; status: string };

const SEED_REMINDERS: Reminder[] = [
  { date: "2026-04-25", msg: "Payment reminder — 6 days before due", status: "Scheduled" },
  { date: "2026-04-30", msg: "Payment due tomorrow",                 status: "Scheduled" },
  { date: "2026-05-02", msg: "Payment overdue — gentle reminder",    status: "Draft"     },
  { date: "2026-04-15", msg: "Application received confirmation",    status: "Posted"    },
];

function RemindersTab({ a }: { a: Application }) {
  // All reminders are delivered as in-app push notifications on the customer's mobile app.
  const [list, setList] = useState<Reminder[]>(SEED_REMINDERS);
  const [postOpen, setPostOpen] = useState(false);

  const addReminder = (r: Reminder) => {
    setList(prev => [r, ...prev]);
    setPostOpen(false);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
            Scheduled notifications
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Delivered as push notifications to the customer&apos;s mobile app.
          </div>
        </div>
        <button
          onClick={() => setPostOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Post reminder
        </button>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Message", "Status"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[12px] font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-600">{r.date}</td>
                <td className="px-4 py-3 text-gray-700">{r.msg}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PostReminderModal
        open={postOpen}
        customerName={a.name}
        onClose={() => setPostOpen(false)}
        onSubmit={addReminder}
      />
    </>
  );
}

function PostReminderModal({
  open,
  customerName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  customerName: string;
  onClose: () => void;
  onSubmit: (r: Reminder) => void;
}) {
  // Default: tomorrow
  const tomorrowIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const [date, setDate] = useState("");
  const [msg, setMsg]   = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(tomorrowIso());
      setMsg("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const MAX = 140;
  const trimmedLen = msg.trim().length;
  const canSubmit = !!date && trimmedLen > 0 && trimmedLen <= MAX;

  const submit = (status: "Scheduled" | "Draft") => {
    if (status === "Scheduled") {
      if (!date) return setError("Pick a send date.");
      if (trimmedLen === 0) return setError("Message can't be empty.");
      if (trimmedLen > MAX) return setError(`Message must be ${MAX} characters or less.`);
    } else {
      // draft only needs a message
      if (trimmedLen === 0) return setError("Message can't be empty.");
    }
    onSubmit({ date, msg: msg.trim(), status });
  };

  const previewMsg = msg.trim() || "Your reminder message will appear here.";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900">Post reminder</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Schedule a push notification to{" "}
              <span className="font-medium text-gray-700">{customerName}</span>&apos;s mobile app.
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

        {/* Body — form + preview */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            {error && (
              <div className="px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-700">Send date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <div className="text-[11px] text-gray-400 mt-1">
                Sent automatically at 9:00 AM local time.
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Message</label>
                <span className={cn(
                  "text-[11px]",
                  trimmedLen > MAX ? "text-red-600" : "text-gray-400"
                )}>
                  {trimmedLen} / {MAX}
                </span>
              </div>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                rows={5}
                placeholder="e.g. Your loan payment is due in 3 days. Tap to view details."
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <div className="text-[11px] text-gray-400 mt-1">
                Keep it short and clear. Push notifications truncate beyond ~140 chars.
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="text-xs font-medium text-gray-700">Preview</div>
            <div className="mt-1">
              {/* Phone notification mockup */}
              <div className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 p-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-md">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-brand-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      W
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                          WeLoan365
                        </span>
                        <span className="text-[10px] text-gray-500">now</span>
                      </div>
                      <div className="text-[13px] font-semibold text-gray-900 mt-0.5">
                        Payment reminder
                      </div>
                      <div className="text-[12px] text-gray-700 mt-0.5 leading-snug">
                        {previewMsg}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 text-center mt-2">
                  Lock screen preview
                </div>
              </div>
            </div>
            <div className="text-[11px] text-gray-500 mt-2">
              Recipient: <span className="font-medium text-gray-700">{customerName}</span>{" "}
              · channel: <span className="font-medium text-gray-700">Mobile app push</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => submit("Draft")}
              disabled={trimmedLen === 0}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md border",
                trimmedLen > 0
                  ? "border-gray-200 text-gray-700 hover:bg-white"
                  : "border-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              Save as draft
            </button>
            <button
              onClick={() => submit("Scheduled")}
              disabled={!canSubmit}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md inline-flex items-center gap-1.5",
                canSubmit
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- tab: Audit Log ---------- */

function AuditTab({ a }: { a: Application }) {
  const log = [
    { at: "2026-04-21 09:42", who: "Visal P.", action: "Viewed application" },
    { at: "2026-04-20 16:10", who: "System",    action: `CBC report retrieved (score ${a.score})` },
    { at: "2026-04-20 15:55", who: "Sophea K.", action: "Moved status: Submitted → Under Review" },
    { at: "2026-04-20 15:48", who: "System",    action: "KYC verified via national ID match" },
    { at: "2026-04-20 15:40", who: a.name,      action: "Submitted application" },
    { at: "2026-04-20 15:38", who: a.name,      action: "Uploaded documents (6 files)" },
  ];
  return (
    <>
      <SectionLabel>All activity as log</SectionLabel>
      <div className="border-l-2 border-gray-200 ml-2">
        {log.map((e, i) => (
          <div key={i} className="relative pl-5 pb-5 last:pb-0">
            <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-2 border-brand-500" />
            <div className="text-xs text-gray-400">{e.at}</div>
            <div className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">{e.who}</span> — {e.action}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- tab: Reports & Analytics ---------- */

// Shared "good / caution / bad" styling so every result reads the same way.
type Tone = "good" | "warn" | "bad";
const RISK_SCALE = ["Low", "Medium-Low", "Medium-High", "High"];
const TONE_CARD: Record<Tone, string> = {
  good: "bg-emerald-50 border-emerald-100",
  warn: "bg-amber-50 border-amber-100",
  bad: "bg-red-50 border-red-100",
};
const TONE_PILL: Record<Tone, string> = {
  good: "bg-emerald-100 text-emerald-700",
  warn: "bg-amber-100 text-amber-700",
  bad: "bg-red-100 text-red-700",
};
const TONE_BAR: Record<Tone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
};

function ResultCard({
  label,
  value,
  tone,
  hint,
  children,
}: {
  label: string;
  value: string;
  tone: Tone;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border p-4", TONE_CARD[tone])}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-gray-900 mt-1">{value}</div>
      {children}
      {hint && <div className="text-[11px] text-gray-500 mt-1.5 leading-snug">{hint}</div>}
    </div>
  );
}

function GuideRow({
  title,
  bands,
}: {
  title: string;
  bands: { label: string; range: string; tone: Tone; active: boolean }[];
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-700 mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {bands.map(b => (
          <span
            key={b.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]",
              b.active
                ? cn(TONE_PILL[b.tone], "border-transparent font-semibold")
                : "border-gray-200 bg-white text-gray-500"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", TONE_BAR[b.tone])} />
            <span>{b.label}</span>
            <span className={b.active ? "opacity-70" : "text-gray-400"}>· {b.range}</span>
            {b.active && <span className="ml-0.5 text-[9px] uppercase tracking-wider">• now</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReportsTab({ a }: { a: Application }) {
  // ---- Inputs actually used by the calculations below ----
  const customer = CUSTOMERS.find(c => c.id === a.cid);
  const income = customer?.monthlyIncome ?? 0;                       // monthly income
  const monthly = (a.amount * (1 + a.rate / 100)) / a.term;          // monthly repayment
  const dti = income > 0 ? monthly / income : 1;                     // debt-to-income ratio
  const cbcPct = a.score / 850;                                      // credit-score share

  // Risk score 0–100 — 55% credit score, 45% repayment capacity (1 − DTI).
  const riskScore = Math.round(100 * (0.55 * cbcPct + 0.45 * (1 - Math.min(dti, 1))));
  const riskBand =
    riskScore >= 75 ? "Low" :
    riskScore >= 60 ? "Medium-Low" :
    riskScore >= 45 ? "Medium-High" : "High";
  const riskTone: Tone = riskScore >= 60 ? "good" : riskScore >= 45 ? "warn" : "bad";
  const riskIdx = RISK_SCALE.indexOf(riskBand);

  // Default probability — inverse of the risk score. Lower is better.
  const pd = Math.max(0.3, Math.round((1 - riskScore / 100) * 19 * 10) / 10);
  const pdTone: Tone = pd <= 5 ? "good" : pd <= 10 ? "warn" : "bad";

  // Recommendation from policy thresholds.
  const action =
    pd <= 5 && riskScore >= 60 ? "Approve" : pd <= 10 ? "Review" : "Reject";
  const actionTone: Tone = action === "Approve" ? "good" : action === "Review" ? "warn" : "bad";

  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

  const formulas: { metric: string; formula: string; worked: string }[] = [
    {
      metric: "Time to approval",
      formula: "date(final approval) − date(submission)",
      worked: "Operational SLA — benchmarked against the branch median for this product (not derived from the applicant's financials).",
    },
    {
      metric: "Risk rating",
      formula: "100 × (0.55 × CBC ÷ 850  +  0.45 × (1 − DTI))",
      worked: `= 100 × (0.55 × ${a.score} ÷ 850 + 0.45 × (1 − ${pct(Math.min(dti, 1))})) = ${riskScore} / 100 → ${riskBand}`,
    },
    {
      metric: "Default probability",
      formula: "(1 − RiskScore ÷ 100) × 19",
      worked: `= (1 − ${riskScore} ÷ 100) × 19 = ${pd}%`,
    },
    {
      metric: "Recommended action",
      formula: "Approve if PD ≤ 5% and Risk ≥ 65  ·  Review if PD ≤ 10%  ·  else Reject",
      worked: `PD ${pd}% · Risk ${riskScore} → ${action}`,
    },
  ];

  return (
    <>
      <SectionLabel>Application analytics</SectionLabel>

      {/* How this works — only the inputs these figures actually use. */}
      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-brand-100 bg-brand-50/60 px-3.5 py-3">
        <Info className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-gray-600 leading-relaxed">
          <span className="font-medium text-gray-900">How this works. </span>
          These figures are <span className="font-medium">decision support, not a final decision</span>.
          They are calculated from the applicant&apos;s{" "}
          <span className="font-medium">credit-bureau (CBC) score</span>,{" "}
          <span className="font-medium">monthly income</span>, and the{" "}
          <span className="font-medium">requested amount &amp; term</span> (which set the monthly
          repayment and the debt-to-income ratio). They refresh whenever these inputs change.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Operational — neutral, not a risk verdict */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs text-gray-500">Time to approval</div>
          <div className="text-xl font-semibold text-gray-900 mt-1">2.3 days</div>
          <div className="text-[11px] text-gray-500 mt-1.5">Branch SLA benchmark for this product.</div>
        </div>

        {/* Risk rating — with a Low → High scale */}
        <ResultCard label="Risk rating" value={riskBand} tone={riskTone}>
          <div className="mt-2">
            <div className="flex gap-0.5">
              {RISK_SCALE.map((b, i) => (
                <div
                  key={b}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i === riskIdx ? TONE_BAR[riskTone] : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Low risk</span>
              <span>High risk</span>
            </div>
          </div>
        </ResultCard>

        {/* Default probability — lower is better */}
        <ResultCard
          label="Default probability"
          value={`${pd}%`}
          tone={pdTone}
          hint="Lower is better — ≤5% within policy, over 10% is high."
        />

        {/* Recommended action */}
        <ResultCard
          label="Recommended action"
          value={action}
          tone={actionTone}
          hint={
            action === "Approve"
              ? "Meets policy — safe to proceed."
              : action === "Review"
              ? "Borderline — manual review advised."
              : "Outside policy — decline or escalate."
          }
        />
      </div>

      {/* Inputs used for this application */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <InputStat label="CBC credit score" value={`${a.score} / 850`} />
        <InputStat label="Monthly income" value={`$${income.toLocaleString()}`} />
        <InputStat label="Monthly repayment" value={`$${Math.round(monthly).toLocaleString()}`} />
        <InputStat label="Debt-to-income (DTI)" value={pct(Math.min(dti, 1))} />
      </div>

      {/* Status guide — what verdict each value gets, current band highlighted */}
      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">
          Status guide
        </div>
        <div className="text-xs text-gray-500 mb-3">
          How the status changes with the value — the current band is highlighted.
        </div>
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          <div className="px-3.5 py-3">
            <GuideRow
              title="Risk rating (0–100 score)"
              bands={[
                { label: "Low", range: "75–100", tone: "good", active: riskBand === "Low" },
                { label: "Medium-Low", range: "60–74", tone: "good", active: riskBand === "Medium-Low" },
                { label: "Medium-High", range: "45–59", tone: "warn", active: riskBand === "Medium-High" },
                { label: "High", range: "0–44", tone: "bad", active: riskBand === "High" },
              ]}
            />
          </div>
          <div className="px-3.5 py-3">
            <GuideRow
              title="Default probability"
              bands={[
                { label: "Low", range: "≤ 5%", tone: "good", active: pd <= 5 },
                { label: "Moderate", range: "5–10%", tone: "warn", active: pd > 5 && pd <= 10 },
                { label: "High", range: "> 10%", tone: "bad", active: pd > 10 },
              ]}
            />
          </div>
          <div className="px-3.5 py-3">
            <GuideRow
              title="Recommended action"
              bands={[
                { label: "Approve", range: "PD ≤ 5% & Risk ≥ 60", tone: "good", active: action === "Approve" },
                { label: "Review", range: "PD ≤ 10%", tone: "warn", active: action === "Review" },
                { label: "Reject", range: "otherwise", tone: "bad", active: action === "Reject" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Formulas — how each of the four results is calculated */}
      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-2">
          How each result is calculated
        </div>
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          {formulas.map(f => (
            <div key={f.metric} className="px-3.5 py-3">
              <div className="text-sm font-medium text-gray-900">{f.metric}</div>
              <div className="mt-1 font-mono text-[11px] text-brand-700 bg-brand-50/60 border border-brand-100 rounded px-2 py-1 inline-block">
                {f.formula}
              </div>
              <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">{f.worked}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function InputStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

/* ---------- tab: Person in Charge ---------- */

function OfficerTab({ a }: { a: Application }) {
  // Local state so the user can preview reassignment without persisting across navigation.
  const [officerName, setOfficerName] = useState(a.officer);
  const [reassignOpen, setReassignOpen] = useState(false);

  const officerRecord = USERS.find(u => u.name === officerName);
  const initials =
    officerName === "Unassigned" ? "?" : officerName.split(" ").map(s => s[0]).join("");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      <div>
        <SectionLabel>Person in charge</SectionLabel>
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
          <div
            className={cn(
              "w-14 h-14 rounded-full text-white flex items-center justify-center text-base font-semibold",
              officerName === "Unassigned" ? "bg-gray-300" : "bg-brand-600"
            )}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">{officerName}</div>
            <div className="text-xs text-gray-500">
              {officerRecord ? `${officerRecord.role} • ${officerRecord.branch}` : `Officer • ${a.branch}`}
            </div>
            {officerRecord && (
              <div className="text-xs text-gray-500 mt-1 truncate">{officerRecord.email}</div>
            )}
          </div>
        </div>
        <button
          onClick={() => setReassignOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          Reassign officer
        </button>
      </div>
      <div>
        <SectionLabel>Approval chain</SectionLabel>
        <ul className="space-y-3">
          {[
            ["Loan Officer",    "Visal P.",  "approved", "Apr 20"],
            ["Senior Officer",  "Sophea K.",  "pending",  "—"],
            ["Branch Manager",  "Ratanak L.", "—",        "—"],
          ].map(([r, n, s, d]) => (
            <li key={r} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  s === "approved" ? "bg-emerald-500" : s === "pending" ? "bg-amber-500" : "bg-gray-300"
                )}
              />
              <div className="flex-1 text-sm">
                <span className="font-medium text-gray-900">{r}</span> —{" "}
                <span className="text-gray-600">{n}</span>
              </div>
              <div className="text-xs text-gray-400">{d}</div>
            </li>
          ))}
        </ul>
      </div>

      <ReassignOfficerModal
        open={reassignOpen}
        currentOfficer={officerName}
        customerName={a.name}
        onClose={() => setReassignOpen(false)}
        onPick={name => {
          setOfficerName(name);
          setReassignOpen(false);
        }}
      />
    </div>
  );
}

/* ---------- tab: Re-structure (peer of Person in Charge) ---------- */

function RestructureTab({ a }: { a: Application }) {
  // Seed the local decision from the stored request so the pill colour
  // matches the list view on first render (e.g. an already-declined request
  // opens with the red "Re-structure request failed" badge).
  const [decision, setDecision] = useState<"pending" | "approved" | "declined">(
    a.restructureRequest?.decision ?? "pending"
  );

  const isApproved = a.status === "Approved";
  const req = a.restructureRequest;

  // Loans that are still in Progress or have been Rejected can't be restructured.
  if (!isApproved) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center bg-gray-50/40">
        <RotateCcw className="w-7 h-7 text-gray-300 mx-auto mb-2" />
        <div className="text-sm font-medium text-gray-900">
          Re-structure not available
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Customers can only request a re-structure on loans that have already been approved.
        </div>
      </div>
    );
  }

  // Approved loan, but no pending customer request.
  if (!req) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center bg-gray-50/40">
        <RotateCcw className="w-7 h-7 text-gray-300 mx-auto mb-2" />
        <div className="text-sm font-medium text-gray-900">
          No pending re-structure request
        </div>
        <div className="text-xs text-gray-500 mt-1">
          When {a.name.split(" ")[0]} submits a re-structure request from the app, the details will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-brand-50/40 border-b border-gray-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900">
              {a.name} requested a loan re-structure
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Submitted on {req.requestedAt} · {a.product} · ${a.amount.toLocaleString()} · {a.term}m
            </div>
          </div>
          {/* Status pill — always visible. Shows the current state of the
              re-structure request: pending (brand), accepted (emerald),
              or request failed (red, when the officer declines). */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
              decision === "pending"
                ? "bg-brand-50 border border-brand-200 text-brand-700"
                : decision === "approved"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            )}
          >
            {decision === "pending" ? (
              <>
                <RotateCcw className="w-3 h-3" />
                Re-structure request
              </>
            ) : decision === "approved" ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Accepted
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Re-structure request failed
              </>
            )}
          </span>
        </div>

        {/* Reason + requested change */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">
              Reason from customer
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-sm text-gray-700 leading-relaxed">
              “{req.reason}”
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">
              Requested change
            </div>
            <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-3 text-sm text-gray-800 leading-relaxed">
              {req.requestedChange}
            </div>
          </div>
        </div>

        {/* Contact actions */}
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-sm text-gray-700 font-medium"
          >
            <MessageCircle className="w-4 h-4 text-brand-600" />
            Chat in app
          </Link>
          <a
            href={`tel:${req.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-sm text-gray-700 font-medium"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            Call {req.phone}
          </a>
        </div>

        {/* Decision footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/60 flex flex-wrap items-center justify-end gap-2">
          <button
            disabled={decision !== "pending"}
            onClick={() => setDecision("declined")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border",
              decision === "pending"
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-gray-200 text-gray-300 cursor-not-allowed"
            )}
          >
            <XCircle className="w-4 h-4" />
            Decline request
          </button>
          <button
            disabled={decision !== "pending"}
            onClick={() => setDecision("approved")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md",
              decision === "pending"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

function ReassignOfficerModal({
  open,
  currentOfficer,
  customerName,
  onClose,
  onPick,
}: {
  open: boolean;
  currentOfficer: string;
  customerName: string;
  onClose: () => void;
  onPick: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  // Pending selection — committed only when the user clicks Save.
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Roles that can own a loan application
  const ELIGIBLE_ROLES = new Set([
    "Credit Officer",
    "Senior Credit Officer",
    "Branch Manager",
    "Admin",
  ]);
  const officers = USERS.filter(
    u => u.status === "Active" && ELIGIBLE_ROLES.has(u.role)
  );

  const q = query.trim().toLowerCase();
  const filtered = officers.filter(
    o =>
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.role.toLowerCase().includes(q) ||
      o.branch.toLowerCase().includes(q)
  );

  const save = () => {
    if (!selected || selected === currentOfficer) return;
    onPick(selected);
  };
  const canSave = !!selected && selected !== currentOfficer;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">Reassign officer</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Pick a new person in charge for{" "}
              <span className="font-medium text-gray-800">{customerName}</span>&apos;s application.
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

        <div className="px-5 py-3 border-b border-gray-200">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, role, branch…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">
              No officers match your search.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map(o => {
                const isCurrent  = o.name === currentOfficer;
                const isSelected = o.name === selected;
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => !isCurrent && setSelected(o.name)}
                      disabled={isCurrent}
                      className={cn(
                        "w-full px-5 py-3 flex items-center gap-3 text-left border-l-2",
                        isCurrent
                          ? "bg-emerald-50/40 cursor-default border-transparent"
                          : isSelected
                          ? "bg-brand-50 border-brand-500"
                          : "hover:bg-gray-50 border-transparent"
                      )}
                    >
                      {/* Radio indicator */}
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          isCurrent
                            ? "border-emerald-500 bg-emerald-500"
                            : isSelected
                            ? "border-brand-600 bg-brand-600"
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {(isCurrent || isSelected) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>

                      <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        {o.name.split(" ").map(s => s[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                          {o.name}
                          {isCurrent && (
                            <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-full px-1.5 py-0.5 inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Currently assigned
                            </span>
                          )}
                          {isSelected && !isCurrent && (
                            <span className="text-[10px] font-medium bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {o.role} · {o.branch}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex-1 min-w-0 truncate">
            {selected ? (
              <>
                <span className="text-gray-500">Reassigning to </span>
                <span className="font-medium text-gray-900">{selected}</span>
              </>
            ) : (
              <>
                <span className="text-gray-500">Current: </span>
                <span className="font-medium text-gray-800">{currentOfficer}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!canSave}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5",
                canSave
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reject reason modal ---------- */

const REJECT_REASONS = [
  { id: "credit",      label: "Credit score below threshold" },
  { id: "income",      label: "Insufficient or unstable income" },
  { id: "dti",         label: "Debt-to-income ratio too high" },
  { id: "docs",        label: "Incomplete or invalid documents" },
  { id: "employment",  label: "Employment history insufficient" },
  { id: "collateral",  label: "Collateral does not meet requirements" },
  { id: "fraud",       label: "Suspected fraud or identity mismatch" },
  { id: "other",       label: "Other (write below)" },
] as const;

function RejectReasonModal({
  open,
  customerName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  customerName: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reasonId, setReasonId] = useState<typeof REJECT_REASONS[number]["id"]>("credit");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReasonId("credit");
      setNote("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const selectedLabel =
    REJECT_REASONS.find(r => r.id === reasonId)?.label ?? "Other";
  const needsNote = reasonId === "other";
  const noteLen = note.trim().length;
  const canSend =
    (!needsNote || noteLen > 0) && noteLen <= 280;

  // Composed message that will be sent to the customer
  const composedMessage =
    reasonId === "other"
      ? note.trim()
      : note.trim()
      ? `${selectedLabel}. ${note.trim()}`
      : selectedLabel;

  const submit = () => {
    if (needsNote && noteLen === 0) {
      return setError("Please write the reason when 'Other' is selected.");
    }
    if (noteLen > 280) {
      return setError("Additional notes must be 280 characters or less.");
    }
    onSubmit(composedMessage);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-gray-900">Reject application</div>
              <div className="text-xs text-gray-500 mt-0.5">
                The reason will be sent to{" "}
                <span className="font-medium text-gray-700">{customerName}</span>{" "}
                directly through the mobile app.
              </div>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
          {error && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Reason — radio list */}
          <div>
            <label className="text-xs font-medium text-gray-700">
              Reason for rejection *
            </label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REJECT_REASONS.map(r => {
                const active = reasonId === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setReasonId(r.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 border rounded-md text-left text-sm transition",
                      active
                        ? "border-red-300 bg-red-50/60 text-red-800"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        active ? "border-red-600 bg-red-600" : "border-gray-300"
                      )}
                    >
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-xs leading-snug">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free-text note */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                {needsNote ? "Reason details *" : "Additional notes (optional)"}
              </label>
              <span className={cn(
                "text-[11px]",
                noteLen > 280 ? "text-red-600" : "text-gray-400"
              )}>
                {noteLen} / 280
              </span>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              maxLength={280}
              placeholder={needsNote
                ? "Explain the reason so the customer knows what happened."
                : "Add context the customer should know (optional)…"}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">
              Customer will receive
            </div>
            <div className="bg-white rounded-md border border-gray-200 p-3">
              <div className="text-sm font-semibold text-gray-900">
                Loan application update
              </div>
              <div className="text-xs text-gray-700 mt-1 leading-relaxed">
                Hi {customerName.split(" ")[0]}, your loan application has been{" "}
                <span className="font-medium text-red-700">declined</span>. Reason:{" "}
                {composedMessage || (
                  <span className="text-gray-400 italic">your reason will appear here</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSend}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md",
              canSend
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <XCircle className="w-4 h-4" />
            Reject &amp; notify customer
          </button>
        </div>
      </div>
    </div>
  );
}
