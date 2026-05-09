"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageCircle,
  FileCheck2,
  RefreshCw,
  Plus,
  Download,
  Banknote,
  Lock,
  ShieldAlert,
  ChevronRight,
  RotateCcw,
  ClipboardCheck,
  Wallet,
  UserCheck,
} from "lucide-react";
import { APPLICATIONS, type Application, type ApplicationStatus } from "@/lib/data";
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
                Approve & route to Cashier
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

        {/* Workflow banner — current stage + next + role context */}
        <WorkflowBanner
          status={a.status}
          roleName={role.name}
          isOwnerRole={role.key === "co"}
          approveBlockedReason={approveBlockedReason}
          mayApproveAmt={mayApproveAmt}
          mayApprove={mayApprove}
          mayDisburse={mayDisburse}
        />

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
          {tab === "reminders" && <RemindersTab />}
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

/* ---------- workflow stages (CO → Approval → Cashier) ---------- */

type Stage = "Origination" | "Approval" | "Disbursement";

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
  const ORIGINATION: StageInfo = {
    key: "Origination",
    label: "Origination",
    role: "Credit Officer",
    description: "CO submits the application with KYC + CBC.",
    icon: ClipboardCheck,
    state: "done",
    who: "Laybun N.",
    when: "Apr 20",
  };
  const APPROVAL: StageInfo = {
    key: "Approval",
    label: "Approval",
    role: "Approval / Senior CO / BM",
    description: "Reviewer approves or rejects within their limit.",
    icon: UserCheck,
    state: "pending",
  };
  const DISBURSEMENT: StageInfo = {
    key: "Disbursement",
    label: "Disbursement",
    role: "Cashier",
    description: "Cashier disburses cash to the customer.",
    icon: Wallet,
    state: "pending",
  };

  if (status === "Pending" || status === "Review") {
    APPROVAL.state = "active";
  } else if (status === "Approved") {
    APPROVAL.state = "done";
    APPROVAL.who = "Sophea K.";
    APPROVAL.when = "Apr 21";
    DISBURSEMENT.state = "active";
  } else if (status === "Disbursed") {
    APPROVAL.state = "done";
    APPROVAL.who = "Sophea K.";
    APPROVAL.when = "Apr 21";
    DISBURSEMENT.state = "done";
    DISBURSEMENT.who = "Pisey C.";
    DISBURSEMENT.when = "Apr 22";
  } else if (status === "Rejected") {
    APPROVAL.state = "failed";
    APPROVAL.who = "Sophea K.";
    APPROVAL.when = "Apr 21";
    DISBURSEMENT.state = "pending";
  }
  return [ORIGINATION, APPROVAL, DISBURSEMENT];
}

function currentStage(status: ApplicationStatus): Stage | null {
  if (status === "Pending" || status === "Review") return "Approval";
  if (status === "Approved") return "Disbursement";
  return null; // terminal: Disbursed / Rejected
}

function nextStage(status: ApplicationStatus): Stage | null {
  if (status === "Pending" || status === "Review") return "Disbursement";
  return null;
}

function WorkflowBanner({
  status,
  roleName,
  isOwnerRole,
  approveBlockedReason,
  mayApproveAmt,
  mayApprove,
  mayDisburse,
}: {
  status: ApplicationStatus;
  roleName: string;
  isOwnerRole: boolean;
  approveBlockedReason: string | null;
  mayApproveAmt: boolean;
  mayApprove: boolean;
  mayDisburse: boolean;
}) {
  const cur = currentStage(status);
  const nxt = nextStage(status);
  const stageRoles: Record<Stage, string> = {
    Origination: "Credit Officer",
    Approval: "Approval / Senior CO",
    Disbursement: "Cashier",
  };

  let actionMsg: React.ReactNode;
  if (status === "Disbursed") {
    actionMsg = <span className="text-emerald-700 font-medium">Workflow complete — funds disbursed.</span>;
  } else if (status === "Rejected") {
    actionMsg = <span className="text-red-700 font-medium">Workflow ended — application rejected.</span>;
  } else if (mayApprove && mayApproveAmt) {
    actionMsg = <span className="text-emerald-700">You can <b>approve & route to Cashier</b>.</span>;
  } else if (mayApprove && !mayApproveAmt && approveBlockedReason) {
    actionMsg = <span className="text-amber-700">{approveBlockedReason}</span>;
  } else if (mayDisburse) {
    actionMsg = <span className="text-emerald-700">Approved — you can <b>disburse</b> now.</span>;
  } else if (isOwnerRole && (status === "Pending" || status === "Review")) {
    actionMsg = <span className="text-gray-700">You submitted this; awaiting approval.</span>;
  } else {
    actionMsg = <span className="text-gray-500">No action available at this stage.</span>;
  }

  return (
    <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-200 flex items-center gap-3 text-xs">
      <ShieldAlert className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
      {cur ? (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Currently with</span>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
              {stageRoles[cur]}
            </span>
          </div>
          {nxt && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Next</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {stageRoles[nxt]}
                </span>
              </div>
            </>
          )}
        </>
      ) : (
        <span className="text-gray-500">Status: <span className="font-medium text-gray-900">{status}</span></span>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 text-gray-500">
        <span>Acting as</span>
        <span className="font-medium text-gray-900">{roleName}</span>
        <span>·</span>
        {actionMsg}
      </div>
    </div>
  );
}

/* ---------- tab: Loan Status ---------- */

function LoanStatusTab({ a }: { a: Application }) {
  const stages = getStages(a.status);
  const monthly = Math.round((a.amount * (1 + a.rate / 100)) / a.term);
  const total   = Math.round(a.amount * (1 + a.rate / 100));

  return (
    <>
      <SectionLabel>Workflow — CO → Approval → Cashier</SectionLabel>

      <div className="flex items-stretch gap-3">
        {stages.map((s, i) => (
          <div key={s.key} className="flex-1 flex">
            <StageCard stage={s} index={i + 1} />
            {i < stages.length - 1 && (
              <div className="flex items-center px-1">
                <ChevronRight
                  className={cn(
                    "w-5 h-5",
                    s.state === "done" ? "text-brand-600" : "text-gray-300"
                  )}
                />
              </div>
            )}
          </div>
        ))}
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
            <div className="divide-y divide-gray-100">
              <Row label="Debt-to-income" value="32%" />
              <Row label="Active loans (other banks)" value="1" />
              <Row label="Closed loans" value="2" />
              <Row label="Defaults / write-offs" value={<span className="text-emerald-600">0</span>} />
              <Row label="Last CBC pull" value={<span className="text-gray-400">{a.sent}</span>} />
            </div>
            <button className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh CBC report
            </button>
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
  const remaining = a.term - 2;

  return (
    <>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Box label="Paid to date" value={`$${Math.round(paid).toLocaleString()}`} tone="green" />
        <Box label="Outstanding" value={`$${Math.round(outstanding).toLocaleString()}`} />
        <Box label="Next due" value="May 1" tone="amber" />
        <Box label="Remaining installments" value={`${remaining}`} />
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

      <div className="flex justify-end gap-2 mt-4">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
          <Download className="w-4 h-4 text-gray-500" />
          Download schedule
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
          Record payment
        </button>
      </div>
    </>
  );
}

/* ---------- tab: Reminders ---------- */

function RemindersTab() {
  const list = [
    { date: "2026-04-25", channel: "SMS",   msg: "Payment reminder — 6 days before due", status: "Scheduled" },
    { date: "2026-04-30", channel: "Push",  msg: "Payment due tomorrow",                 status: "Scheduled" },
    { date: "2026-05-02", channel: "SMS",   msg: "Payment overdue — gentle reminder",    status: "Draft"     },
    { date: "2026-04-15", channel: "Email", msg: "Application received confirmation",    status: "Posted"    },
  ];
  const toneFor = (t: string) =>
    t === "SMS"
      ? "bg-sky-50 text-sky-700"
      : t === "Push"
      ? "bg-violet-50 text-violet-700"
      : "bg-gray-100 text-gray-600";
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
          Scheduled notifications
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
          <Plus className="w-4 h-4" />
          Post reminder
        </button>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Channel", "Message", "Status"].map(h => (
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
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                      toneFor(r.channel)
                    )}
                  >
                    {r.channel}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{r.msg}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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
  const reports = [
    { t: "Application summary", d: "PDF • 1-click" },
    { t: "Risk assessment",     d: "PDF • 1-click" },
    { t: "Customer profile",    d: "PDF • 1-click" },
    { t: "Repayment forecast",  d: "PDF • 1-click" },
    { t: "Document bundle",     d: "ZIP • all docs" },
    { t: "Full audit",          d: "PDF • timeline" },
  ];
  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Box label="Time to approval" value="2.3 days" />
        <Box label="Risk rating" value="Medium-Low" />
        <Box label="Projected yield" value="$362.50" tone="green" />
      </div>
      <SectionLabel>Generate report</SectionLabel>
      <div className="grid grid-cols-3 gap-3">
        {reports.map(r => (
          <button
            key={r.t}
            className="text-left border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <div className="text-sm font-medium text-gray-900">{r.t}</div>
            <div className="text-xs text-gray-500 mt-0.5">{r.d}</div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------- tab: Person in Charge ---------- */

function OfficerTab({ a }: { a: Application }) {
  const initials = a.officer === "Unassigned" ? "?" : a.officer.split(" ").map(s => s[0]).join("");
  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <SectionLabel>Person in charge</SectionLabel>
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
          <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center text-base font-semibold">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{a.officer}</div>
            <div className="text-xs text-gray-500">Loan Officer • {a.branch}</div>
            <div className="text-xs text-gray-500 mt-1">laybunnavitou@kosign.com.kh</div>
          </div>
        </div>
        <button className="mt-3 text-xs text-brand-600 hover:underline font-medium">
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
    </div>
  );
}
