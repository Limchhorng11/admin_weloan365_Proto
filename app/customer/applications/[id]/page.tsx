"use client";

import { useState } from "react";
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
} from "lucide-react";
import { APPLICATIONS, type Application } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "status",    label: "Loan Status" },
  { key: "kyc",       label: "KYC / Docs / CBC" },
  { key: "repayment", label: "Repayment & Collection" },
  { key: "reminders", label: "Reminders / Notifications" },
  { key: "audit",     label: "Audit Log" },
  { key: "reports",   label: "Reports & Analytics" },
  { key: "officer",   label: "Person in Charge" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const a = APPLICATIONS.find(x => x.id === params.id);
  if (!a) return notFound();

  const [tab, setTab] = useState<TabKey>("status");

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
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              Request info
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50">
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Approve &amp; disburse
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
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

/* ---------- tab: Loan Status ---------- */

function LoanStatusTab({ a }: { a: Application }) {
  const steps = ["Submitted", "Under Review", "KYC Verified", "Credit Check", "Approved", "Disbursed"];
  const currentIdx =
    a.status === "Pending"   ? 1 :
    a.status === "Review"    ? 2 :
    a.status === "Approved"  ? 4 :
    a.status === "Disbursed" ? 5 :
    a.status === "Rejected"  ? 1 : 0;

  const monthly = Math.round((a.amount * (1 + a.rate / 100)) / a.term);
  const total   = Math.round(a.amount * (1 + a.rate / 100));

  return (
    <>
      <SectionLabel>Application progress</SectionLabel>
      <div className="flex items-start">
        {steps.map((s, i) => {
          const done = i <= currentIdx;
          return (
            <div key={s} className={cn("flex items-start", i < steps.length - 1 && "flex-1")}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                    done ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"
                  )}
                >
                  {i + 1}
                </div>
                <div
                  className={cn(
                    "text-[11px] mt-2 whitespace-nowrap",
                    done ? "text-gray-900 font-medium" : "text-gray-400"
                  )}
                >
                  {s}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-4",
                    i < currentIdx ? "bg-brand-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <Box label="Requested amount" value={`$${a.amount.toLocaleString()}`} />
        <Box label="Monthly payment" value={`$${monthly.toLocaleString()}`} />
        <Box label="Total repayable" value={`$${total.toLocaleString()}`} />
      </div>
    </>
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
