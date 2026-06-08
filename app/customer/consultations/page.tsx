"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { CONSULTATIONS, CUSTOMERS, USERS, FEEDBACK } from "@/lib/data";
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
  MessageSquare,
  Search,
  Check,
  Crown,
  Building2,
  Briefcase,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 8;

type Consult = (typeof CONSULTATIONS)[number];
type Officer = (typeof USERS)[number];
type Feedback = (typeof FEEDBACK)[number];
type Resp = { message: string; sentAt: string };

type FilterKind = "all" | "consultations" | "feedback";

type Item =
  | { kind: "consultation"; id: string; ts: number; data: Consult }
  | { kind: "feedback";     id: string; ts: number; data: Feedback };

/* Parse "2026-04-21 09:12" or "2026-04-21" into a sortable timestamp. */
function parseTs(s: string): number {
  if (!s) return 0;
  const isoish = s.includes(" ") ? s.replace(" ", "T") : s;
  const n = Date.parse(isoish);
  return Number.isFinite(n) ? n : 0;
}

/* Truncate a long preview to ~80 chars with an ellipsis. */
function clip(s: string, max = 80): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;
}

export default function ConsultationsPage() {
  const { user } = useRole();

  /* ----- Consultation state ----- */
  const [list, setList] = useState<Consult[]>(CONSULTATIONS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const active = openId ? list.find(c => c.id === openId) ?? null : null;
  const pickerConsult = pickerFor ? list.find(c => c.id === pickerFor) ?? null : null;

  /* ----- Feedback state ----- */
  const [responses, setResponses] = useState<Record<string, Resp>>(() =>
    Object.fromEntries(
      FEEDBACK.filter(f => f.response).map(f => [f.id, { message: f.response!, sentAt: f.date }])
    )
  );
  const [openFeedbackId, setOpenFeedbackId] = useState<string | null>(null);
  const activeFeedback = openFeedbackId ? FEEDBACK.find(f => f.id === openFeedbackId) ?? null : null;

  const submitResponse = (id: string, message: string) => {
    const now = new Date();
    const sentAt = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setResponses(prev => ({ ...prev, [id]: { message, sentAt } }));
    setOpenFeedbackId(null);
  };

  /* ----- Unified items list (consultations + feedback, newest first) ----- */
  const items = useMemo<Item[]>(() => {
    const cs: Item[] = list.map(c => ({
      kind: "consultation",
      id: c.id,
      ts: parseTs(c.requested),
      data: c,
    }));
    const fs: Item[] = FEEDBACK.map(f => ({
      kind: "feedback",
      id: f.id,
      ts: parseTs(f.date),
      data: f,
    }));
    return [...cs, ...fs].sort((a, b) => b.ts - a.ts);
  }, [list]);

  const counts = useMemo(
    () => ({
      all: items.length,
      consultations: items.filter(i => i.kind === "consultation").length,
      feedback: items.filter(i => i.kind === "feedback").length,
    }),
    [items]
  );

  const unassignedCount = list.filter(c => c.officer === "Unassigned").length;
  const unrepliedCount = FEEDBACK.filter(f => !responses[f.id]).length;

  /* ----- Filter ----- */
  const [filter, setFilter] = useState<FilterKind>("all");
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter(i =>
      filter === "consultations" ? i.kind === "consultation" : i.kind === "feedback"
    );
  }, [items, filter]);

  /* ----- Pagination ----- */
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => setPage(1), [filter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const firstIdx = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastIdx = Math.min(page * PAGE_SIZE, filtered.length);

  /* ----- Consultation mutators ----- */
  const closeConsultation = (id: string) =>
    setList(prev => prev.map(c => (c.id === id ? { ...c, status: "closed" } : c)));

  const reopenConsultation = (id: string) =>
    setList(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.officer === "Unassigned" ? "pending" : "open" }
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
              status:
                officer !== "Unassigned" && c.status === "pending" ? "open" : c.status,
            }
          : c
      )
    );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Customer Messages"
        subtitle={`${items.length} messages · ${unassignedCount} unassigned · ${unrepliedCount} unreplied`}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 px-6 py-4 border-b border-gray-200">
          <FilterChip
            label="All"
            count={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label="Consultations"
            count={counts.consultations}
            badge={unassignedCount > 0 ? `${unassignedCount} unassigned` : undefined}
            active={filter === "consultations"}
            onClick={() => setFilter("consultations")}
          />
          <FilterChip
            label="Feedback"
            count={counts.feedback}
            badge={unrepliedCount > 0 ? `${unrepliedCount} unreplied` : undefined}
            active={filter === "feedback"}
            onClick={() => setFilter("feedback")}
          />
        </div>

        {/* Unified table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Type", "Customer", "Subject", "Preview", "Date", "Status"].map(h => (
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">
                    No messages in this view.
                  </td>
                </tr>
              ) : (
                paginated.map(item =>
                  item.kind === "consultation" ? (
                    <ConsultRow
                      key={`c-${item.id}`}
                      c={item.data}
                      currentUserName={user.name}
                      onOpen={() => setOpenId(item.id)}
                    />
                  ) : (
                    <FeedbackRow
                      key={`f-${item.id}`}
                      f={item.data}
                      responded={!!responses[item.id]}
                      onOpen={() => setOpenFeedbackId(item.id)}
                    />
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
          <div>
            Showing{" "}
            <span className="font-medium text-gray-700">
              {firstIdx}-{lastIdx}
            </span>{" "}
            of <span className="font-medium text-gray-700">{filtered.length}</span>
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

      <ResponseModal
        feedback={activeFeedback}
        existing={activeFeedback ? responses[activeFeedback.id] : undefined}
        onClose={() => setOpenFeedbackId(null)}
        onSubmit={msg => activeFeedback && submitResponse(activeFeedback.id, msg)}
      />
    </div>
  );
}

/* ---------- filter chip ---------- */

function FilterChip({
  label,
  count,
  active,
  badge,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition",
        active
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "text-[11px] font-medium rounded-full px-1.5 py-0.5",
          active ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
        )}
      >
        {count}
      </span>
      {badge && (
        <span className="text-[10px] font-medium uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ---------- unified table rows ---------- */

function TypeChip({ kind }: { kind: "consultation" | "feedback" }) {
  const isConsult = kind === "consultation";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
        isConsult
          ? "bg-brand-50 text-brand-700 border border-brand-100"
          : "bg-gray-100 text-gray-600 border border-gray-200"
      )}
    >
      {isConsult ? (
        <MessageCircle className="w-2.5 h-2.5" />
      ) : (
        <MessageSquare className="w-2.5 h-2.5" />
      )}
      {isConsult ? "Consult" : "Feedback"}
    </span>
  );
}

function ConsultRow({
  c,
  currentUserName,
  onOpen,
}: {
  c: Consult;
  currentUserName: string;
  onOpen: () => void;
}) {
  const isMine = c.officer === currentUserName;
  return (
    <tr
      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 cursor-pointer"
      onClick={onOpen}
    >
      <td className="px-6 py-3.5 align-middle">
        <TypeChip kind="consultation" />
      </td>
      <td className="px-6 py-3.5 font-medium text-gray-900">
        <div className="flex items-center gap-1.5">
          {c.customer}
          {isMine && (
            <span className="text-[10px] font-medium bg-brand-50 text-brand-700 rounded-full px-1.5 py-0.5">
              You
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-3.5 text-gray-700">{c.topic}</td>
      <td className="px-6 py-3.5 text-gray-600 max-w-[320px]">
        <div className="truncate">{clip(c.note ?? "", 80)}</div>
      </td>
      <td className="px-6 py-3.5 text-gray-600 text-xs whitespace-nowrap">{c.requested}</td>
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
      <td className="px-6 py-3.5 text-right">
        <button
          onClick={e => {
            e.stopPropagation();
            onOpen();
          }}
          className="text-xs text-brand-600 hover:underline font-medium"
        >
          Open
        </button>
      </td>
    </tr>
  );
}

function FeedbackRow({
  f,
  responded,
  onOpen,
}: {
  f: Feedback;
  responded: boolean;
  onOpen: () => void;
}) {
  return (
    <tr
      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 cursor-pointer"
      onClick={onOpen}
    >
      <td className="px-6 py-3.5 align-middle">
        <TypeChip kind="feedback" />
      </td>
      <td className="px-6 py-3.5 font-medium text-gray-900">{f.customer}</td>
      <td className="px-6 py-3.5 text-gray-700">Feedback</td>
      <td className="px-6 py-3.5 text-gray-600 max-w-[320px]">
        <div className="truncate">{clip(f.text, 80)}</div>
      </td>
      <td className="px-6 py-3.5 text-gray-600 text-xs whitespace-nowrap">{f.date}</td>
      <td className="px-6 py-3.5">
        <StatusBadge status={responded ? "Replied" : "No reply"} />
      </td>
      <td className="px-6 py-3.5 text-right">
        <button
          onClick={e => {
            e.stopPropagation();
            onOpen();
          }}
          className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium"
        >
          <Pencil className="w-3 h-3" />
          {responded ? "Edit reply" : "Reply"}
        </button>
      </td>
    </tr>
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

/* ====================================================================
   Response modal — reply/edit reply to a customer feedback entry.
   ==================================================================== */

function ResponseModal({
  feedback,
  existing,
  onClose,
  onSubmit,
}: {
  feedback: Feedback | null;
  existing?: Resp;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (feedback) {
      setMessage(existing?.message ?? "");
    }
  }, [feedback, existing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && feedback) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [feedback, onClose]);

  if (!feedback) return null;

  const trimmedLen = message.trim().length;
  const canSend = trimmedLen > 0 && trimmedLen <= 280;
  const isEdit = !!existing;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit response" : "Reply to feedback"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              The reply will be delivered to{" "}
              <span className="font-medium text-gray-700">{feedback.customer}</span>&apos;s mobile app.
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

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {/* Original feedback */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold flex items-center justify-center">
                  {feedback.customer.split(" ").map(s => s[0]).join("")}
                </div>
                <div className="text-sm font-medium text-gray-900">{feedback.customer}</div>
              </div>
              <div className="text-[11px] text-gray-500 font-mono">{feedback.id} · {feedback.date}</div>
            </div>
            <div className="text-sm text-gray-700 mt-1">{feedback.text}</div>
          </div>

          {/* Reply textarea */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">Your response</label>
              <span className={cn(
                "text-[11px]",
                trimmedLen > 280 ? "text-red-600" : "text-gray-400"
              )}>
                {trimmedLen} / 280
              </span>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              maxLength={280}
              placeholder="Thank you for your feedback. We'll look into this and follow up shortly..."
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <div className="text-[11px] text-gray-400 mt-1">
              Sent as a push notification + in-app message in the customer mobile app.
            </div>
          </div>

          {existing && (
            <div className="text-[11px] text-emerald-700 inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              Previously sent on {existing.sentAt}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={() => canSend && onSubmit(message.trim())}
            disabled={!canSend}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md",
              canSend
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Send className="w-3.5 h-3.5" />
            {isEdit ? "Update response" : "Send response"}
          </button>
        </div>
      </div>
    </div>
  );
}
