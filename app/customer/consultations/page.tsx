"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TableToolbar } from "@/components/table-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { CONSULTATIONS, CUSTOMERS, USERS } from "@/lib/data";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import {
  X,
  Send,
  UserPlus,
  Phone,
  ExternalLink,
  CheckCircle2,
  Paperclip,
  MessageCircle,
  Search,
  Check,
  Crown,
  Building2,
  Briefcase,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 3;

type Consult = (typeof CONSULTATIONS)[number];
type Officer = (typeof USERS)[number];

export default function ConsultationsPage() {
  const { user } = useRole();

  const [list, setList] = useState<Consult[]>(CONSULTATIONS);
  const [openId, setOpenId] = useState<string | null>(null);
  // ID of consultation we're currently picking an officer for, or null.
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const active = openId ? list.find(c => c.id === openId) ?? null : null;
  const pickerConsult = pickerFor ? list.find(c => c.id === pickerFor) ?? null : null;

  const unassignedCount = list.filter(c => c.officer === "Unassigned").length;

  /* ---------- pagination ---------- */
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [list, page]);

  const firstIdx = list.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastIdx = Math.min(page * PAGE_SIZE, list.length);

  const closeConsultation = (id: string) =>
    setList(prev => prev.map(c => (c.id === id ? { ...c, status: "closed" } : c)));

  // Revert a closed consultation back to open so the operator can keep working on it.
  const reopenConsultation = (id: string) =>
    setList(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              status: c.officer === "Unassigned" ? "pending" : "open",
            }
          : c
      )
    );

  const reassign = (id: string, officer: string) =>
    setList(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              officer,
              // when a real officer is assigned, move from pending → open
              status:
                officer !== "Unassigned" && c.status === "pending" ? "open" : c.status,
            }
          : c
      )
    );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Consultation Requests"
        subtitle={`${list.length} requests · ${unassignedCount} unassigned`}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <TableToolbar />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["Customer", "Topic", "Requested", "Status", "Officer"].map(h => (
                <th
                  key={h}
                  className="text-left px-6 py-3 text-[12px] font-medium text-gray-500"
                >
                  {h}
                </th>
              ))}
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginated.map(c => {
              const isMine    = c.officer === user.name;
              const unassigned = c.officer === "Unassigned";
              const isClosed   = c.status === "closed";
              return (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-3.5 font-medium text-gray-900">{c.customer}</td>
                  <td className="px-6 py-3.5 text-gray-700">{c.topic}</td>
                  <td className="px-6 py-3.5 text-gray-600 text-xs">{c.requested}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge
                      status={
                        c.status === "open"
                          ? "Open"
                          : c.status === "closed"
                          ? "Closed"
                          : "Pending"
                      }
                    />
                  </td>
                  <td className="px-6 py-3.5">
                    {unassigned ? (
                      <span className="text-gray-400 italic">Unassigned</span>
                    ) : isMine ? (
                      <span className="inline-flex items-center gap-1 text-brand-700 font-medium">
                        {c.officer}
                        <span className="text-[10px] font-medium bg-brand-50 text-brand-700 rounded-full px-1.5 py-0.5">
                          You
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-600">{c.officer}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      {!isClosed && (
                        // Single action — opens the officer picker for any role.
                        // Self-claim is still possible via the "Assign to me"
                        // shortcut inside the picker.
                        <button
                          onClick={() => setPickerFor(c.id)}
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          {unassigned ? "Assign to person" : "Reassign to person"}
                        </button>
                      )}
                      <button
                        onClick={() => setOpenId(c.id)}
                        className="text-xs text-brand-600 hover:underline font-medium"
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
          <div>
            Showing{" "}
            <span className="font-medium text-gray-700">
              {firstIdx}-{lastIdx}
            </span>{" "}
            of <span className="font-medium text-gray-700">{list.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-700">{page}</span> of{" "}
              <span className="font-medium text-gray-700">{totalPages}</span>
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className={cn(
                  "p-1.5 rounded border border-gray-200",
                  page === 1
                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className={cn(
                  "p-1.5 rounded border border-gray-200",
                  page === totalPages
                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConsultationDetailModal
        consultation={active}
        onClose={() => setOpenId(null)}
        onCloseConsultation={() => {
          if (active) {
            closeConsultation(active.id);
            setOpenId(null);
          }
        }}
        // "Assign to person" / "Reassign to person" — close this modal
        // and hand off to the same officer picker the list uses.
        onPickAssignee={() => {
          if (active) {
            setPickerFor(active.id);
            setOpenId(null);
          }
        }}
        onReopen={() => active && reopenConsultation(active.id)}
      />

      <OfficerPickerModal
        consultation={pickerConsult}
        currentUserName={user.name}
        onClose={() => setPickerFor(null)}
        onPick={officer => {
          if (pickerFor) reassign(pickerFor, officer);
          setPickerFor(null);
        }}
      />
    </div>
  );
}

/* ---------- detail modal ---------- */

function ConsultationDetailModal({
  consultation,
  onClose,
  onCloseConsultation,
  onPickAssignee,
  onReopen,
}: {
  consultation: Consult | null;
  onClose: () => void;
  onCloseConsultation: () => void;
  onPickAssignee: () => void;
  onReopen: () => void;
}) {
  const { user } = useRole();
  const [reply, setReply] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  if (!consultation) return null;

  const customer = CUSTOMERS.find(c => c.name === consultation.customer);
  const unassigned = consultation.officer === "Unassigned";
  const isMine = consultation.officer === user.name;
  const isClosed = consultation.status === "closed";

  const initials = consultation.customer.split(" ").map(s => s[0]).join("");
  const statusLabel =
    consultation.status === "open"
      ? "Open"
      : consultation.status === "closed"
      ? "Closed"
      : "Pending";

  const send = () => {
    if (!reply.trim()) return;
    // No real backend — just clear the input for the demo
    setReply("");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-600 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-gray-500">{consultation.id}</span>
                <span className="text-gray-300">·</span>
                <StatusBadge status={statusLabel} />
              </div>
              <div className="text-base font-semibold text-gray-900 mt-0.5">
                {consultation.customer}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {customer?.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </span>
                )}
                {customer && (
                  <Link
                    href={`/customer/accounts/${customer.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline font-medium"
                  >
                    Open profile
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
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

        {/* Customer's request — structured intake from the mobile form */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Customer's request
            </div>
            <div className="text-[11px] text-gray-500">
              Submitted{" "}
              <span className="font-medium text-gray-700">{consultation.requested}</span>
            </div>
          </div>
          <dl className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            <InfoRow label="Topic" value={consultation.topic} />
            <InfoRow label="Preferred date" value={consultation.preferredDate} />
            <InfoRow label="Preferred time" value={consultation.preferredTime} />
            <InfoRow label="Preferred branch" value={consultation.preferredBranch} />
            <InfoRow
              label="Officer"
              value={
                unassigned ? (
                  <span className="text-gray-400 italic">Unassigned</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    {consultation.officer}
                    {isMine && (
                      <span className="text-[10px] font-medium bg-brand-50 text-brand-700 rounded-full px-1.5 py-0.5">
                        You
                      </span>
                    )}
                  </span>
                )
              }
            />
            {consultation.note && (
              <InfoRow
                label="Notes"
                value={
                  <span className="text-gray-700 italic">"{consultation.note}"</span>
                }
              />
            )}
          </dl>
        </div>

        {/* Closed-state indicator (only when the consultation is closed) */}
        {isClosed && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Consultation closed
          </div>
        )}

        {/* Reply / actions */}
        {!isClosed && (unassigned || isMine) && (
          <div className="border-t border-gray-200 p-3 bg-white">
            {unassigned ? (
              <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <MessageCircle className="w-4 h-4" />
                  This consultation isn't assigned yet. Assign an officer to start replying.
                </div>
                <button
                  onClick={onPickAssignee}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Assign to person
                </button>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <button
                  className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                  title="Attach"
                  type="button"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Reply to customer…"
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button
                  onClick={send}
                  disabled={!reply.trim()}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md font-medium",
                    reply.trim()
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50/60">
          {!isClosed ? (
            <button
              onClick={onPickAssignee}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium"
            >
              <Briefcase className="w-3.5 h-3.5 text-gray-500" />
              {unassigned ? "Assign to person" : "Reassign to person"}
            </button>
          ) : (
            // Keep layout balanced — empty spacer when closed.
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
            >
              Close
            </button>
            {isClosed ? (
              <button
                onClick={onReopen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 bg-white text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                Edit
              </button>
            ) : (
              <button
                onClick={() => setConfirmClose(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark as closed
              </button>
            )}
          </div>
        </div>

        {/* Confirm "Mark as closed" overlay */}
        {confirmClose && (
          <div
            className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-10"
            onClick={() => setConfirmClose(false)}
          >
            <div
              className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    Mark consultation as closed?
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                    The conversation with{" "}
                    <span className="font-medium text-gray-700">
                      {consultation.customer}
                    </span>{" "}
                    will be archived. You won't be able to send further replies.
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmClose(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmClose(false);
                    onCloseConsultation();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Yes, mark as closed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({
  side,
  name,
  children,
}: {
  side: "left" | "right";
  name: string;
  children: React.ReactNode;
}) {
  const isRight = side === "right";
  return (
    <div className={cn("flex", isRight && "justify-end")}>
      <div className={cn("max-w-md")}>
        <div
          className={cn(
            "text-[11px] mb-1 text-gray-500",
            isRight && "text-right"
          )}
        >
          {name}
        </div>
        <div
          className={cn(
            "px-3 py-2 text-sm rounded-lg",
            isRight
              ? "bg-brand-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------- info row (label / value pair used across the popup) ---------- */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
      <dt className="text-sm text-gray-500 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 text-right">{value}</dd>
    </div>
  );
}

/* ====================================================================
   Officer picker modal — "Table 2: person in charge to consult"
   Opens from a row's Assign / Reassign action. Admin chooses which
   officer will handle the customer's consultation request.
   ==================================================================== */

function OfficerPickerModal({
  consultation,
  currentUserName,
  onClose,
  onPick,
}: {
  consultation: Consult | null;
  currentUserName: string;
  onClose: () => void;
  onPick: (officer: string) => void;
}) {
  const [query, setQuery] = useState("");

  if (!consultation) return null;

  // Only active staff can take consultations.
  // Cashiers and Compliance typically wouldn't field customer consultations,
  // so filter to roles that interact with customers.
  const CONSULTING_ROLES = new Set([
    "Credit Officer",
    "Senior Credit Officer",
    "Branch Manager",
    "Admin",
  ]);
  const officers: Officer[] = USERS.filter(
    u => u.status === "Active" && CONSULTING_ROLES.has(u.role)
  );

  const q = query.trim().toLowerCase();
  const filtered = officers.filter(o =>
    !q ||
    o.name.toLowerCase().includes(q) ||
    o.role.toLowerCase().includes(q) ||
    o.branch.toLowerCase().includes(q)
  );

  const initials = (n: string) => n.split(" ").map(s => s[0]).join("");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">Assign consultant</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Who should handle{" "}
              <span className="font-medium text-gray-800">{consultation.customer}</span>'s
              request?
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5 truncate">
              {consultation.id} · {consultation.topic}
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

        {/* Search */}
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

        {/* Quick "Assign to me" row (only when not already mine) */}
        {consultation.officer !== currentUserName && (
          <button
            onClick={() => onPick(currentUserName)}
            className="px-5 py-3 border-b border-gray-100 hover:bg-brand-50/60 flex items-center gap-3 text-left group"
          >
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
              {initials(currentUserName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                Assign to me
                <span className="text-[10px] font-medium bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5">
                  You
                </span>
              </div>
              <div className="text-[11px] text-gray-500 truncate">{currentUserName}</div>
            </div>
            <UserPlus className="w-4 h-4 text-brand-600 group-hover:scale-110 transition flex-shrink-0" />
          </button>
        )}

        {/* Officer list — the "Table 2" */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Consultants ({filtered.length})
          </div>
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">
              No officers match your search.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map(o => {
                const isCurrent = o.name === consultation.officer;
                const isMe = o.name === currentUserName;
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => onPick(o.name)}
                      disabled={isCurrent}
                      className={cn(
                        "w-full px-5 py-3 flex items-center gap-3 text-left",
                        isCurrent
                          ? "bg-brand-50/60 cursor-default"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        {initials(o.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                          {o.name}
                          {isMe && (
                            <span className="text-[10px] font-medium bg-brand-50 text-brand-700 rounded-full px-1.5 py-0.5">
                              You
                            </span>
                          )}
                          {o.role === "Admin" && (
                            <Crown className="w-3 h-3 text-amber-500" />
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-full px-1.5 py-0.5 inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              Currently assigned
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate flex items-center gap-3 mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {o.role}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {o.branch}
                          </span>
                        </div>
                      </div>
                      {!isCurrent && (
                        <span className="text-xs text-brand-600 font-medium flex-shrink-0">
                          Assign →
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between text-xs">
          <div className="text-gray-500">
            Currently with:{" "}
            <span className="font-medium text-gray-800">
              {consultation.officer === "Unassigned" ? "Unassigned" : consultation.officer}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
