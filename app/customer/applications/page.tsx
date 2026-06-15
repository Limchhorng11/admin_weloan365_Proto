"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  APPLICATIONS,
  BRANCHES,
  type Application,
  type ApplicationStatus,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

type StatusFacet = "all" | ApplicationStatus;

type Filters = {
  status:   StatusFacet;
  branches: string[];
};

const EMPTY_FILTERS: Filters = {
  status:   "all",
  branches: [],
};

const PAGE_SIZE = 8;

export default function ApplicationsPage() {

  const [list]                = useState<Application[]>(APPLICATIONS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [query, setQuery]     = useState("");
  const [page, setPage]       = useState(1);

  const [filterOpen, setFilterOpen] = useState(false);

  // ---- overview counts ----
  const overview = useMemo(() => {
    const progress    = list.filter(a => a.status === "Progress").length;
    const approved    = list.filter(a => a.status === "Approved").length;
    const restructure = list.filter(a => a.status === "Approved" && a.restructureRequest).length;
    const rejected    = list.filter(a => a.status === "Rejected").length;
    return { progress, approved, restructure, rejected };
  }, [list]);

  // ---- filtered list ----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(a => {
      if (q && !`${a.id} ${a.name} ${a.product} ${a.officer}`.toLowerCase().includes(q))
        return false;
      if (filters.status !== "all" && a.status !== filters.status) return false;
      if (filters.branches.length && !filters.branches.includes(a.branch)) return false;
      return true;
    });
  }, [list, query, filters]);

  // Reset to page 1 when anything filter-y changes
  useEffect(() => setPage(1), [query, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  // ---- active filter count for badge ----
  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.branches.length  ? 1 : 0);


  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Loan Applications"
        subtitle="Review and process all customer loan applications"
      />

      {/* 4-block overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <OverviewTile
          icon={Loader2}
          iconClass="text-amber-600 bg-amber-50"
          label="In progress"
          value={overview.progress}
          hint="Awaiting review or approval"
        />
        <OverviewTile
          icon={CheckCircle2}
          iconClass="text-emerald-600 bg-emerald-50"
          label="Approved"
          value={overview.approved}
          hint="Approved & active loans"
        />
        <OverviewTile
          icon={RotateCcw}
          iconClass="text-brand-600 bg-brand-50"
          label="Re-structure"
          value={overview.restructure}
          hint="Approved loans with a re-structure request"
        />
        <OverviewTile
          icon={XCircle}
          iconClass="text-red-600 bg-red-50"
          label="Rejected"
          value={overview.rejected}
          hint="Declined applications"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All applications</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === 0
                ? "No applications"
                : `Showing ${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-full sm:w-56"
              />
            </div>

            <SimpleFilterPopover
              open={filterOpen}
              onOpenChange={setFilterOpen}
              filters={filters}
              onChange={setFilters}
              activeCount={activeFilterCount}
            />

            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700">
              <Download className="w-4 h-4 text-gray-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-medium text-gray-900">No applications match</div>
            <div className="text-xs text-gray-500 mt-1">
              Try adjusting search or filters.
            </div>
            {(query || activeFilterCount > 0) && (
              <button
                onClick={() => {
                  setQuery("");
                  setFilters(EMPTY_FILTERS);
                }}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50"
              >
                Clear all
              </button>
            )}
          </div>
        ) : (
          <>
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {["ID", "Customer", "Product", "Branch", "Loan range", "Applied", "Status", "Remark"].map(h => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-[12px] font-medium text-gray-500 whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {h}
                        <ArrowUpDown className="w-3 h-3 text-gray-300" />
                      </span>
                    </th>
                  ))}
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => {
                  // Re-structure remark is meaningful only on approved loans
                  // that have a customer-submitted request.
                  const hasRestructure =
                    r.status === "Approved" && !!r.restructureRequest;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                    >
                      <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{r.id}</td>
                      <td className="px-6 py-3.5 text-gray-900 font-medium">{r.name}</td>
                      <td className="px-6 py-3.5 text-gray-700">{r.product}</td>
                      <td className="px-6 py-3.5 text-gray-600">{r.branch}</td>
                      <td className="px-6 py-3.5 text-gray-700">{r.range}</td>
                      <td className="px-6 py-3.5 text-gray-600">{r.sent}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-3.5">
                        {hasRestructure ? (
                          (() => {
                            const decision = r.restructureRequest?.decision ?? "pending";
                            if (decision === "approved") {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-nowrap">
                                  <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" />
                                  Accepted
                                </span>
                              );
                            }
                            if (decision === "declined") {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 border border-red-200 text-red-700 whitespace-nowrap">
                                  <XCircle className="w-2.5 h-2.5 flex-shrink-0" />
                                  Re-structure request failed
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 border border-brand-200 text-brand-700 whitespace-nowrap">
                                <RotateCcw className="w-2.5 h-2.5 flex-shrink-0" />
                                Re-structure request
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/customer/applications/${r.id}`}
                          className="text-xs text-brand-600 hover:underline font-medium"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="md:hidden divide-y divide-gray-100">
            {paginated.map(r => {
              const decision = r.restructureRequest?.decision ?? "pending";
              const hasRestructure = r.status === "Approved" && !!r.restructureRequest;
              const rsTone =
                decision === "approved"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : decision === "declined"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-brand-50 border-brand-200 text-brand-700";
              const rsLabel =
                decision === "approved"
                  ? "Re-structure accepted"
                  : decision === "declined"
                  ? "Re-structure failed"
                  : "Re-structure request";
              return (
                <div key={r.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{r.name}</div>
                      <div className="text-[11px] font-mono text-gray-400 mt-0.5">{r.id}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div className="col-span-2">
                      <div className="text-gray-400">Product</div>
                      <div className="text-gray-700">{r.product}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Amount</div>
                      <div className="text-gray-700">{r.range}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Applied</div>
                      <div className="text-gray-700">{r.sent}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-400">Branch</div>
                      <div className="text-gray-700">{r.branch}</div>
                    </div>
                  </div>
                  {hasRestructure && (
                    <div className="mt-2">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border", rsTone)}>
                        {rsLabel}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 text-right">
                    <Link
                      href={`/customer/applications/${r.id}`}
                      className="text-xs text-brand-600 hover:underline font-medium"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
            <div>
              Showing{" "}
              <span className="font-medium text-gray-700">{startIdx + 1}</span>–
              <span className="font-medium text-gray-700">
                {Math.min(startIdx + PAGE_SIZE, filtered.length)}
              </span>{" "}
              of <span className="font-medium text-gray-700">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  const active = n === page;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={cn(
                        "min-w-[28px] h-7 px-2 text-xs rounded border",
                        active
                          ? "bg-brand-600 border-brand-600 text-white font-medium"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

/* ---------- overview tile ---------- */

function OverviewTile({
  icon: Icon,
  iconClass,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1.5">{value}</div>
          <div className="text-[11px] text-gray-400 mt-1.5">{hint}</div>
        </div>
        <div className={cn("w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0", iconClass)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   Simple filter popover — Status + Branch only.
   ==================================================================== */

const STATUS_OPTIONS: { v: StatusFacet; label: string }[] = [
  { v: "all",      label: "All statuses" },
  { v: "Progress", label: "Progress" },
  { v: "Approved", label: "Approved" },
  { v: "Rejected", label: "Rejected" },
];

function SimpleFilterPopover({
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

  const setStatus = (v: StatusFacet) => onChange({ ...filters, status: v });
  const toggleBranch = (name: string) => {
    const next = filters.branches.includes(name)
      ? filters.branches.filter(b => b !== name)
      : [...filters.branches, name];
    onChange({ ...filters, branches: next });
  };
  const clearAll = () => onChange(EMPTY_FILTERS);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md",
          open || activeCount > 0
            ? "bg-brand-50 border-brand-200 text-brand-700"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <SlidersHorizontal
          className={cn(
            "w-4 h-4",
            open || activeCount > 0 ? "text-brand-600" : "text-gray-500"
          )}
        />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-semibold">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            "w-3 h-3 transition",
            open ? "rotate-180" : "",
            open || activeCount > 0 ? "text-brand-600" : "text-gray-400"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden"
        >
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Filters
            </div>
            <button
              onClick={clearAll}
              disabled={activeCount === 0}
              className={cn(
                "text-xs font-medium",
                activeCount === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-brand-600 hover:underline"
              )}
            >
              Clear all
            </button>
          </div>

          {/* Status */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-[11px] font-medium text-gray-500 mb-2">Status</div>
            <div className="space-y-1">
              {STATUS_OPTIONS.map(o => {
                const on = filters.status === o.v;
                return (
                  <button
                    key={o.v}
                    onClick={() => setStatus(o.v)}
                    className={cn(
                      "w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-sm",
                      on ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span>{o.label}</span>
                    {on && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Branch */}
          <div className="px-4 py-3">
            <div className="text-[11px] font-medium text-gray-500 mb-2">Branch</div>
            <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin">
              {BRANCHES.map(b => {
                const on = filters.branches.includes(b.name);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBranch(b.name)}
                    className={cn(
                      "w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-sm",
                      on ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span className="truncate">{b.name}</span>
                    {on && <Check className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
