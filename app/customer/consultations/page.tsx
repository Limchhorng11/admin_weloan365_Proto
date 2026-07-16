"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { CONSULTATIONS, CUSTOMERS, USERS } from "@/lib/data";
import { useRole } from "@/lib/role-context";
import { useNotifications } from "@/lib/notifications";
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
  Bell,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

const PAGE_SIZE = 8;

type Consult = (typeof CONSULTATIONS)[number];
type Officer = (typeof USERS)[number];

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

/* ----- Consultation scheduling / status flow -----
   Pending  → customer requested, no officer assigned yet
   Waiting  → officer assigned + schedule confirmed; waiting for the date
              (a reminder fires when the appointment is within 24h)
   Closed   → the scheduled date has passed (auto), or closed manually

   Demo anchor: the mock schedule dates are in 2026, so we treat this fixed
   day as "today" to show every stage (past = closed, tomorrow = due-soon). */
const TODAY = new Date(2026, 4, 26); // May 26, 2026

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(s: string): Date | null {
  const m = s.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const mo = MONTHS[m[1]];
  if (mo === undefined) return null;
  return new Date(Number(m[3]), mo, Number(m[2]));
}

/** Whole days from TODAY to the date string (negative = in the past). */
function daysUntil(s: string): number | null {
  const d = parseDate(s);
  if (!d) return null;
  const a = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

type DisplayStatus = "Pending" | "Waiting" | "Closed";

function displayStatus(c: Consult): DisplayStatus {
  if (c.status === "closed") return "Closed";
  if (c.status === "pending" || c.officer === "Unassigned") return "Pending";
  const du = daysUntil(c.preferredDate);
  if (du !== null && du < 0) return "Closed"; // auto-close once the date passes
  return "Waiting";
}

/** A waiting consultation within 24h fires a reminder to officer + customer. */
function isDueSoon(c: Consult): boolean {
  if (displayStatus(c) !== "Waiting") return false;
  const du = daysUntil(c.preferredDate);
  return du !== null && du >= 0 && du <= 1;
}

function dueLabel(c: Consult): string {
  const du = daysUntil(c.preferredDate);
  if (du === 0) return "Today";
  if (du === 1) return "Tomorrow";
  return c.preferredDate;
}

type StatusFilter = "all" | DisplayStatus;
type Filters = { status: StatusFilter };
const EMPTY_FILTERS: Filters = { status: "all" };

// Persisted to localStorage so assignments/closures survive the
// sign-in-as-a-role switch on the login screen, which remounts this page.
const LIST_STORAGE_KEY = "weloan_consultations";

function loadList(): Consult[] {
  try {
    const raw = localStorage.getItem(LIST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Consult[]) : CONSULTATIONS;
  } catch {
    return CONSULTATIONS;
  }
}

export default function ConsultationsPage() {
  // useSearchParams() (for the ?open= notification deep-link) requires a
  // Suspense boundary during static export/build.
  return (
    <Suspense fallback={null}>
      <ConsultationsPageInner />
    </Suspense>
  );
}

function ConsultationsPageInner() {
  const { user, can } = useRole();
  const { addNotification } = useNotifications();
  const canAssign = can("consultation.assign");

  /* ----- Consultation state ----- */
  const [list, setList] = useState<Consult[]>(CONSULTATIONS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setList(loadList());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore (storage disabled) */
    }
  }, [list, hydrated]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const active = openId ? list.find(c => c.id === openId) ?? null : null;
  const pickerConsult = pickerFor ? list.find(c => c.id === pickerFor) ?? null : null;

  // Opened via a notification link — jump straight to that consultation.
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!hydrated) return;
    const openParam = searchParams.get("open");
    if (openParam && list.some(c => c.id === openParam)) {
      setOpenId(openParam);
      router.replace("/customer/consultations", { scroll: false });
    }
  }, [hydrated, searchParams, list, router]);

  /* ----- Search + filter ----- */
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = filters.status !== "all" ? 1 : 0;

  // Officers who can't assign only handle consultations already in their
  // charge — the list scopes down to their own rows instead of everyone's.
  const scoped = useMemo(
    () => (canAssign ? list : list.filter(c => c.officer === user.name)),
    [list, canAssign, user.name]
  );

  /* ----- Consultations, newest first, then search + status filter ----- */
  const sorted = useMemo(
    () => [...scoped].sort((a, b) => parseTs(b.requested) - parseTs(a.requested)),
    [scoped]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter(c => {
      if (filters.status !== "all" && displayStatus(c) !== filters.status) return false;
      if (q && !`${c.customer} ${c.topic} ${c.officer} ${c.id}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [sorted, query, filters]);

  const pendingCount = scoped.filter(c => displayStatus(c) === "Pending").length;
  const waitingCount = scoped.filter(c => displayStatus(c) === "Waiting").length;
  const dueSoonCount = scoped.filter(isDueSoon).length;

  /* ----- Pagination ----- */
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => setPage(1), [query, filters]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const firstIdx = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastIdx = Math.min(page * PAGE_SIZE, filtered.length);

  /* ----- Consultation mutators ----- */
  // Assigning a person also confirms the schedule from the customer's request:
  // the consultation moves to "waiting" (or straight to "closed" if the
  // requested date has already passed).
  const assignOfficer = (id: string, officer: string) => {
    const consult = list.find(c => c.id === id);
    setList(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        if (c.status === "closed") return { ...c, officer };
        const du = daysUntil(c.preferredDate);
        return { ...c, officer, status: du !== null && du < 0 ? "closed" : "waiting" };
      })
    );
    if (consult && officer !== consult.officer) {
      addNotification({
        title: `You were assigned to ${consult.customer}'s consultation`,
        meta: "Just now",
        kind: "info",
        forUser: officer,
        href: `/customer/consultations?open=${consult.id}`,
      });
    }
  };

  const closeConsultation = (id: string) =>
    setList(prev => prev.map(c => (c.id === id ? { ...c, status: "closed" } : c)));

  const reopenConsultation = (id: string) =>
    setList(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.officer === "Unassigned" ? "pending" : "waiting" }
          : c
      )
    );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Consultations"
        subtitle={`${waitingCount} waiting · ${pendingCount} need scheduling · ${dueSoonCount} due within 24h`}
      />

      {/* Reminder banner — officer-in-charge + customer are alerted a day before */}
      {dueSoonCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Bell className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">
              {dueSoonCount} consultation{dueSoonCount > 1 ? "s" : ""} scheduled within 24 hours.
            </span>{" "}
            A reminder has been sent to the officer in charge and the customer.
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All consultations</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === scoped.length
                ? `${scoped.length} consultations`
                : `${filtered.length} of ${scoped.length} consultations`}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search consultations..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-full sm:w-56"
              />
            </div>

            <ConsultFilterPopover
              open={filterOpen}
              onOpenChange={setFilterOpen}
              filters={filters}
              onChange={setFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="px-6 py-2.5 bg-gray-50/60 border-b border-gray-200 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-500">Filters:</span>
            <ConsultChip
              label={`Status: ${filters.status}`}
              onClear={() => setFilters(EMPTY_FILTERS)}
            />
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-[11px] text-brand-600 hover:underline font-medium ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Table (md and up) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["Customer", "Purpose", "Schedule", "Officer", "Status", "Action"].map(h => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-[12px] font-medium text-gray-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-500">
                    <div>No consultations match.</div>
                    {(query || activeFilterCount > 0) && (
                      <button
                        onClick={() => {
                          setQuery("");
                          setFilters(EMPTY_FILTERS);
                        }}
                        className="mt-3 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50"
                      >
                        Clear search &amp; filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map(c => (
                  <ConsultRow
                    key={c.id}
                    c={c}
                    currentUserName={user.name}
                    canAssign={canAssign}
                    onOpen={() => setOpenId(c.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginated.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-gray-500">
              <div>No consultations match.</div>
              {(query || activeFilterCount > 0) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setFilters(EMPTY_FILTERS);
                  }}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50"
                >
                  Clear search &amp; filters
                </button>
              )}
            </div>
          ) : (
            paginated.map(c => {
              const status = displayStatus(c);
              const dueSoon = isDueSoon(c);
              return (
                <div key={c.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">{c.customer}</span>
                    <StatusBadge status={status} />
                  </div>
                  <div className="text-xs text-gray-500">{c.topic}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
                    <CalendarClock className="w-3 h-3 text-gray-400" />
                    {c.preferredDate} · {c.preferredTime}
                    {dueSoon && (
                      <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-1.5 py-0.5">
                        {dueLabel(c)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {c.officer === "Unassigned" ? "Unassigned" : c.officer}
                    </span>
                    <button
                      onClick={() => setOpenId(c.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium"
                    >
                      {status === "Pending" && canAssign ? "Assign" : "View"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
          if (pickerFor) assignOfficer(pickerFor, officer);
          setPickerFor(null);
        }}
      />
    </div>
  );
}

/* ---------- filter chip + popover ---------- */

function ConsultChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-medium border border-brand-100">
      {label}
      <button onClick={onClear} className="hover:bg-brand-100 rounded-full p-0.5">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

function ConsultFilterPopover({
  open,
  onOpenChange,
  filters,
  onChange,
  activeCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: Filters;
  onChange: (f: Filters) => void;
  activeCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-gray-700",
          open ? "bg-gray-50 border-gray-300" : "bg-white border-gray-200 hover:bg-gray-50"
        )}
      >
        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="text-[10px] font-medium bg-brand-600 text-white rounded-full px-1.5 py-0.5">
            {activeCount}
          </span>
        )}
        <ChevronDown className={cn("w-3 h-3 text-gray-400 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[220px] bg-white border border-gray-200 rounded-lg shadow-xl z-30">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="font-semibold text-sm text-gray-900">Filter consultations</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Filter by status.</div>
          </div>
          <div className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">
              Status
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {(["all", "Pending", "Waiting", "Closed"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onChange({ status: s })}
                  className={cn(
                    "px-2 py-1.5 text-xs rounded-md border text-left",
                    filters.status === s
                      ? "bg-brand-50 border-brand-300 text-brand-700 font-medium"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- consultation table row ---------- */

function ConsultRow({
  c,
  currentUserName,
  canAssign,
  onOpen,
}: {
  c: Consult;
  currentUserName: string;
  canAssign: boolean;
  onOpen: () => void;
}) {
  const isMine = c.officer === currentUserName;
  const status = displayStatus(c);
  const dueSoon = isDueSoon(c);
  const scheduled = status !== "Pending";
  return (
    <tr
      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 cursor-pointer"
      onClick={onOpen}
    >
      <td className="px-6 py-3.5 font-medium text-gray-900">
        <div className="flex items-center gap-1.5">
          {c.customer}
          {isMine && canAssign && (
            <span className="text-[10px] font-medium bg-brand-50 text-brand-700 rounded-full px-1.5 py-0.5">
              You
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-3.5 text-gray-700">{c.topic}</td>
      <td className="px-6 py-3.5 text-gray-600 text-xs whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
          <span>
            {c.preferredDate} · {c.preferredTime}
          </span>
          {dueSoon && (
            <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-1.5 py-0.5">
              {dueLabel(c)}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-3.5 text-gray-600 text-xs whitespace-nowrap">
        {c.officer === "Unassigned" ? (
          <span className="text-gray-400 italic">Unassigned</span>
        ) : (
          c.officer
        )}
      </td>
      <td className="px-6 py-3.5">
        <StatusBadge status={status} />
      </td>
      <td className="px-6 py-3.5">
        <button
          onClick={e => {
            e.stopPropagation();
            onOpen();
          }}
          className="text-xs text-brand-600 hover:underline font-medium whitespace-nowrap"
        >
          {status === "Pending" && canAssign ? "Assign" : "View"}
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
  const { user, can } = useRole();
  const canAssign = can("consultation.assign");
  const canClose = can("consultation.close");
  const [reply, setReply] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  if (!consultation) return null;

  const customer = CUSTOMERS.find(c => c.name === consultation.customer);
  const status = displayStatus(consultation);
  const unassigned = status === "Pending";
  const isMine = consultation.officer === user.name;
  const isClosed = status === "Closed";
  const isWaiting = status === "Waiting";
  const dueSoon = isDueSoon(consultation);

  const initials = consultation.customer.split(" ").map(s => s[0]).join("");
  const statusLabel = status;

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
            <InfoRow label="Purpose" value={consultation.topic} />
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

        {/* Confirmed schedule + reminder (waiting) */}
        {isWaiting && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    Scheduled · {consultation.preferredDate} at {consultation.preferredTime}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {consultation.preferredBranch} · confirmed from the customer&apos;s request
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-sky-700">{dueLabel(consultation)}</span>
            </div>
            {dueSoon && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <Bell className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  Reminder sent — this consultation is{" "}
                  <span className="font-medium">{dueLabel(consultation).toLowerCase()}</span>.
                  {!unassigned && (
                    <>
                      {" "}Notified <span className="font-medium">{consultation.officer}</span> and{" "}
                      <span className="font-medium">{consultation.customer}</span>.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Closed-state indicator (only when the consultation is closed) */}
        {isClosed && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Consultation completed — closed after {consultation.preferredDate}
          </div>
        )}

        {/* Reply / actions */}
        {!isClosed && (unassigned || isMine) && (
          <div className="border-t border-gray-200 p-3 bg-white">
            {unassigned ? (
              <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <MessageCircle className="w-4 h-4" />
                  Not scheduled yet.{" "}
                  {canAssign
                    ? "Assign a person in charge to confirm the customer's requested date."
                    : "Waiting for a person in charge to be assigned."}
                </div>
                {canAssign && (
                  <button
                    onClick={onPickAssignee}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700 whitespace-nowrap"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Assign &amp; confirm
                  </button>
                )}
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
          {!isClosed && canAssign ? (
            <button
              onClick={onPickAssignee}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium"
            >
              <Briefcase className="w-3.5 h-3.5 text-gray-500" />
              {unassigned ? "Assign & confirm schedule" : "Reassign person"}
            </button>
          ) : (
            // Keep layout balanced — empty spacer when closed or not permitted.
            <div />
          )}
          <div className="flex items-center gap-2">
            {!isClosed && canClose && (
              <button
                onClick={() => setConfirmClose(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark as completed
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
  // Customer Service typically wouldn't field loan consultations, so filter
  // to the roles that do — matches the app's actual seeded roles (Credit
  // Officer, Senior Officer, Admin), not the approval-chain labels used
  // elsewhere (Senior Credit Officer / Branch Manager aren't real roles here).
  const CONSULTING_ROLES = new Set([
    "Credit Officer",
    "Senior Officer",
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
            <div className="text-base font-semibold text-gray-900">
              Assign &amp; confirm schedule
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Pick the person in charge for{" "}
              <span className="font-medium text-gray-800">{consultation.customer}</span>. The
              schedule is confirmed from their request.
            </div>
            <div className="text-[11px] text-gray-500 mt-1 inline-flex items-center gap-1.5">
              <CalendarClock className="w-3 h-3 text-gray-400" />
              {consultation.preferredDate} · {consultation.preferredTime} ·{" "}
              {consultation.preferredBranch}
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

