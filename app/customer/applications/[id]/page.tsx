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
  FileCheck2,
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
} from "lucide-react";
import { APPLICATIONS, USERS, type Application, type ApplicationStatus } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";

type TabDef = { key: TabKey; label: string; permission?: string };

const TABS: TabDef[] = [
  { key: "status",    label: "Loan Status" },
  { key: "kyc",       label: "KYC / Docs / CBC",          permission: "customer.view" },
  { key: "repayment", label: "Repayment & Collection",    permission: "payment.view" },
  { key: "reminders", label: "Reminders / Notifications" },
  { key: "audit",     label: "Audit Log",                 permission: "audit.view" },
  { key: "reports",   label: "Reports & Analytics",       permission: "report.view" },
  { key: "officer",   label: "Person in Charge" },
];

type TabKey =
  | "status"
  | "kyc"
  | "repayment"
  | "reminders"
  | "audit"
  | "reports"
  | "officer";

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const a = APPLICATIONS.find(x => x.id === params.id);
  if (!a) return notFound();

  const { role, can, canApprove } = useRole();

  const visibleTabs = useMemo(
    () => TABS.filter(t => !t.permission || can(t.permission)),
    [can]
  );

  const [tab, setTab] = useState<TabKey>("status");
  // Keep the active tab valid when the role changes.
  useEffect(() => {
    if (!visibleTabs.some(t => t.key === tab)) {
      setTab(visibleTabs[0]?.key ?? "status");
    }
  }, [visibleTabs, tab]);

  // ----- Workflow stage helpers -----
  // Workflow: CO  →  Approval  →  Cashier
  const inApprovalStage    = a.status === "Pending" || a.status === "Review";
  const inDisbursementStage = a.status === "Approved";
  const isTerminal         = a.status === "Disbursed" || a.status === "Rejected";

  // ----- Action button gates: combine permission + workflow status -----
  const mayRequestInfo = can("loan.review")     && inApprovalStage;
  const mayReject      = can("loan.reject")     && inApprovalStage;
  const mayApprove     = can("loan.approve")    && inApprovalStage;
  const mayApproveAmt  = canApprove(a.amount); // amount within approval limit
  const mayDisburse    = can("disburse.execute") && inDisbursementStage;
  const mayReopen      = role.key === "admin"   && a.status === "Rejected"; // admin override
  const mayUnreject    = role.key === "admin"   && a.status === "Disbursed"; // admin reverse

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
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link
              href="/customer/applications"
              className="p-1 -ml-1 text-gray-400 hover:text-gray-700 rounded"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="text-xs font-mono text-gray-500">{a.id}</div>
              <div className="text-xl font-semibold text-gray-900">{a.name}</div>
              <div className="text-sm text-gray-500">
                {a.product} • ${a.amount.toLocaleString()} • {a.term}m • {a.rate}% APR
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={a.status} />

            {mayRequestInfo && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                Request info
              </button>
            )}

            {mayReject && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50">
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
          {tab === "repayment" && <RepaymentTab a={a} />}
          {tab === "reminders" && <RemindersTab a={a} />}
          {tab === "audit"     && <AuditTab a={a} />}
          {tab === "reports"   && <ReportsTab />}
          {tab === "officer"   && <OfficerTab a={a} />}
        </div>
      </div>
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
    who: "Laybun N.",
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

  if (status === "Pending") {
    REVIEW.state = "active";
  } else if (status === "Review") {
    REVIEW.state = "done";
    REVIEW.who = "Laybun N.";
    REVIEW.when = "Apr 20";
    CREDIT_CHECK.state = "active";
  } else if (status === "Approved" || status === "Disbursed") {
    REVIEW.state = "done";
    REVIEW.who = "Laybun N.";
    REVIEW.when = "Apr 20";
    CREDIT_CHECK.state = "done";
    CREDIT_CHECK.who = "System / Sophea K.";
    CREDIT_CHECK.when = "Apr 21";
    APPROVAL.state = "done";
    APPROVAL.who = "Sophea K.";
    APPROVAL.when = "Apr 21";
  } else if (status === "Rejected") {
    // For demo: assume rejected after credit check
    REVIEW.state = "done";
    REVIEW.who = "Laybun N.";
    REVIEW.when = "Apr 20";
    CREDIT_CHECK.state = "done";
    CREDIT_CHECK.who = "System / Sophea K.";
    CREDIT_CHECK.when = "Apr 21";
    APPROVAL.state = "failed";
    APPROVAL.who = "Sophea K.";
    APPROVAL.when = "Apr 21";
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
        <div
          className="grid gap-3"
          style={{
            gridAutoFlow: "column",
            gridAutoColumns: "calc((100% - 24px) / 3)",
          }}
        >
          {stages.map((s, i) => (
            <StageCard key={s.key} stage={s} index={i + 1} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
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

/* ---------- tab: KYC / Docs / CBC ---------- */

function KycTab({ a }: { a: Application }) {
  const docs = [
    { name: "National ID",      status: "verified" as const },
    { name: "Payslip",          status: "verified" as const },
    { name: "Bank Statement",   status: "verified" as const },
    { name: "Collateral Deed",  status: "verified" as const },
    { name: "Business License", status: "pending"  as const },
    { name: "Utility Bill",     status: "verified" as const },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <SectionLabel>Personal information (KYC)</SectionLabel>
          <dl className="divide-y divide-gray-100">
            <Row label="Full name" value={a.name} />
            <Row label="Customer ID" value={<span className="font-mono text-xs">{a.cid}</span>} />
            <Row label="National ID" value="200112 ••• 4521" />
            <Row label="Date of birth" value="1993-08-12" />
            <Row label="Address" value="Phnom Penh, Cambodia" />
            <Row label="Occupation" value="Retail supervisor" />
            <Row label="Monthly income" value="$850" />
            <Row label="KYC status" value={<StatusBadge status="Verified" />} />
          </dl>
        </div>
        <div>
          <SectionLabel>Credit Bureau (CBC) report</SectionLabel>
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-gray-500">Credit score</span>
                <span className="font-medium text-gray-900">{a.score} / 850</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full",
                    a.score >= 720 ? "bg-emerald-500" : a.score >= 680 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${(a.score / 850) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel>Uploaded documents</SectionLabel>
        <div className="grid grid-cols-4 gap-3">
          {docs.map(d => (
            <div key={d.name} className="border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-md flex items-center justify-center",
                  d.status === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}
              >
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{d.name}</div>
                <div
                  className={cn(
                    "text-[11px]",
                    d.status === "verified" ? "text-emerald-600" : "text-amber-600"
                  )}
                >
                  {d.status === "verified" ? "Verified" : "Pending"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
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
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Box label="Paid to date" value={`$${Math.round(paid).toLocaleString()}`} tone="green" />
        <Box label="Outstanding" value={`$${Math.round(outstanding).toLocaleString()}`} />
        <Box label="Next due" value="May 1" tone="amber" />
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
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
      <div className="flex items-center justify-between mb-4">
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
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 grid grid-cols-2 gap-6">
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
    { at: "2026-04-21 09:42", who: "Laybun N.", action: "Viewed application" },
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

function ReportsTab() {
  return (
    <>
      <SectionLabel>Application analytics</SectionLabel>
      <div className="grid grid-cols-4 gap-3">
        <Box label="Time to approval"    value="2.3 days" />
        <Box label="Risk rating"         value="Medium-Low" />
        <Box label="Default probability" value="4.2%" tone="green" />
        <Box label="Recommended action"  value="Approve" tone="green" />
      </div>
    </>
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
    <div className="grid grid-cols-2 gap-8">
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
            ["Loan Officer",    "Laybun N.",  "approved", "Apr 20"],
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
