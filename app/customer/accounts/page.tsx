"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ChangePinModal } from "@/components/change-pin-modal";
import { CUSTOMERS, BRANCHES } from "@/lib/data";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;
// KYC filter exposes only the two actionable states the admin needs to triage:
//   - Verified → onboarding done, customer is ready to apply
//   - Pending  → onboarding in progress, may need a nudge
// "Rejected" is intentionally not a filter facet — those accounts are typically
// suspended or being remediated and are handled via the suspended-row treatment.
type KycFacet = "all" | "verified" | "pending";
// Account-state filter — single-toggle facet: "all" is the default everyday
// view; "suspended" is the compliance / audit lens. Active isn't a separate
// bucket because it's already the implicit baseline of "all".
type AccountFacet = "all" | "suspended";

export default function CustomersPage() {
  // The mock data is the source of truth — no add/edit on this page anymore.
  const customers = CUSTOMERS;

  /* ---------- toolbar state ---------- */
  const [query, setQuery] = useState("");
  const [filterKyc, setFilterKyc] = useState<KycFacet>("all");
  const [filterAccount, setFilterAccount] = useState<AccountFacet>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Customer whose PIN is being changed — drives the in-place modal so the
  // "Change pin" action no longer needs to navigate to the detail page.
  const [pinCustomer, setPinCustomer] = useState<string | null>(null);

  // Close filter dropdown on outside click / Escape.
  useEffect(() => {
    if (!filterOpen) return;
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  /* ---------- derive list ---------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter(c => {
      if (filterKyc !== "all" && c.kyc !== filterKyc) return false;
      // Account-status facet — treat a missing accountStatus as "active"
      // (default for the vast majority of seeded customers).
      const accountState = c.accountStatus ?? "active";
      if (filterAccount !== "all" && accountState !== filterAccount) return false;
      if (filterBranch !== "all" && c.branch !== filterBranch) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.branch.toLowerCase().includes(q)
      );
    });
  }, [customers, query, filterKyc, filterAccount, filterBranch]);

  const activeFilterCount =
    (filterKyc !== "all" ? 1 : 0) +
    (filterAccount !== "all" ? 1 : 0) +
    (filterBranch !== "all" ? 1 : 0);

  /* ---------- pagination ---------- */
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Snap back to a valid page whenever the result set shrinks.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const firstIdx = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastIdx = Math.min(page * PAGE_SIZE, filtered.length);

  // Whenever a filter or query changes, return to page 1.
  useEffect(() => {
    setPage(1);
  }, [query, filterKyc, filterAccount, filterBranch]);

  const clearFilters = () => {
    setFilterKyc("all");
    setFilterAccount("all");
    setFilterBranch("all");
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="All Customer Accounts"
        subtitle={`${customers.length} records`}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <div className="hidden sm:block" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search phone number"
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-full sm:w-56"
              />
            </div>

            {/* Filter dropdown */}
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md",
                  filterOpen || activeFilterCount > 0
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
                aria-expanded={filterOpen}
                aria-haspopup="menu"
              >
                <SlidersHorizontal
                  className={cn(
                    "w-4 h-4",
                    filterOpen || activeFilterCount > 0 ? "text-brand-600" : "text-gray-500"
                  )}
                />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition",
                    filterOpen ? "rotate-180" : "",
                    filterOpen || activeFilterCount > 0 ? "text-brand-600" : "text-gray-400"
                  )}
                />
              </button>

              {filterOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Filters
                    </div>
                    <button
                      onClick={clearFilters}
                      disabled={activeFilterCount === 0}
                      className={cn(
                        "text-xs font-medium",
                        activeFilterCount === 0
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-brand-600 hover:underline"
                      )}
                    >
                      Clear all
                    </button>
                  </div>

                  {/* KYC */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-[11px] font-medium text-gray-500 mb-2">KYC status</div>
                    <div className="space-y-1">
                      {([
                        { v: "all", label: "All statuses" },
                        { v: "verified", label: "Verified" },
                        { v: "pending", label: "Pending" },
                      ] as { v: KycFacet; label: string }[]).map(o => {
                        const on = filterKyc === o.v;
                        return (
                          <button
                            key={o.v}
                            onClick={() => setFilterKyc(o.v)}
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

                  {/* Account status — single-toggle facet. "All" is the
                      default everyday view; flipping to Suspended isolates the
                      deleted accounts for compliance review. */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-[11px] font-medium text-gray-500 mb-2">Account status</div>
                    <div className="space-y-1">
                      {([
                        { v: "all", label: "All" },
                        { v: "suspended", label: "Inactive" },
                      ] as { v: AccountFacet; label: string }[]).map(o => {
                        const on = filterAccount === o.v;
                        return (
                          <button
                            key={o.v}
                            onClick={() => setFilterAccount(o.v)}
                            className={cn(
                              "w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-sm",
                              on ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <span className="inline-flex items-center gap-2">
                              {/* Red dot echoes the Suspended badge tone in the
                                  table; "All" gets no dot since it has no tone. */}
                              {o.v === "suspended" && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                              )}
                              {o.label}
                            </span>
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
                      <button
                        onClick={() => setFilterBranch("all")}
                        className={cn(
                          "w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-sm",
                          filterBranch === "all"
                            ? "bg-brand-50 text-brand-700"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <span>All branches</span>
                        {filterBranch === "all" && <Check className="w-3.5 h-3.5 text-brand-600" />}
                      </button>
                      {BRANCHES.map(b => {
                        const on = filterBranch === b.name;
                        return (
                          <button
                            key={b.id}
                            onClick={() => setFilterBranch(b.name)}
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
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["ID", "Name", "Phone", "Status", "Loans", "Branch", "Device"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      {h}
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    </span>
                  </th>
                ))}
                <th className="text-left px-6 py-3 text-[12px] font-medium text-gray-500 whitespace-nowrap">
                  Action
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-gray-500">
                    No customers match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map(c => {
                  const suspended = c.accountStatus === "suspended";
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-b border-gray-100 last:border-0 hover:bg-gray-50/60",
                        // Suspended customers stay in the list for history /
                        // compliance but read as muted, untouchable rows.
                        suspended && "bg-gray-50/40 opacity-70"
                      )}
                      title={
                        suspended
                          ? `Account deleted by customer on ${c.deletedAt ?? "—"}`
                          : undefined
                      }
                    >
                      <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{c.id}</td>
                      <td
                        className={cn(
                          "px-6 py-3.5 font-medium",
                          suspended ? "text-gray-500 line-through" : "text-gray-900"
                        )}
                      >
                        {c.name}
                      </td>
                      {/* Phone stays visible even when suspended — admins may
                          still need to contact the customer (e.g. to confirm the
                          deletion was intentional, or to follow up on an
                          outstanding loan). All other PII columns are dashed. */}
                      <td className="px-6 py-3.5 text-gray-600">{c.phone}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={suspended ? "Inactive" : "Active"} />
                      </td>
                      <td className="px-6 py-3.5 text-gray-700">{c.loans}</td>
                      <td className="px-6 py-3.5 text-gray-600">
                        {suspended ? <span className="text-gray-300">—</span> : c.branch}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600">
                        {suspended ? (
                          <span className="text-gray-300">—</span>
                        ) : c.devices.length > 0 ? (
                          <span className="relative inline-block group cursor-default">
                            <span>
                              {c.devices[0].model.length > 7
                                ? `${c.devices[0].model.slice(0, 7)}…`
                                : c.devices[0].model}
                            </span>
                            {/* Styled hover tooltip — popup with the full model name */}
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-20 whitespace-nowrap px-2 py-1 rounded-md bg-gray-900 text-white text-[11px] font-medium opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition shadow-lg"
                            >
                              {c.devices[0].model}
                              {/* Caret pointing down toward the text */}
                              <span className="absolute left-1/2 -translate-x-1/2 top-full -mt-px w-2 h-2 bg-gray-900 rotate-45" />
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {suspended ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <button
                            onClick={() => setPinCustomer(c.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                            Change pin
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {/* Suspended and active rows both link to the customer's
                            profile via "Detail" — the destination page can
                            render an audit / restore view when the account is
                            suspended, but the affordance label stays consistent
                            across the whole table. */}
                        <Link
                          href={`/customer/accounts/${c.id}`}
                          className="text-xs text-brand-600 hover:underline font-medium"
                          title={
                            suspended
                              ? "Open the audit record for this deleted account"
                              : undefined
                          }
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })
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

      {pinCustomer && (
        <ChangePinModal
          customerName={pinCustomer}
          onClose={() => setPinCustomer(null)}
        />
      )}
    </div>
  );
}

