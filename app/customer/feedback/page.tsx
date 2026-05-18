"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { FEEDBACK } from "@/lib/data";
import {
  Star,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

type DateFilter = "all" | "today" | "7d" | "30d" | "month" | "lastmonth";

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all",       label: "All time" },
  { value: "today",     label: "Today" },
  { value: "7d",        label: "Last 7 days" },
  { value: "30d",       label: "Last 30 days" },
  { value: "month",     label: "This month" },
  { value: "lastmonth", label: "Last month" },
];

/** Today is anchored to the latest feedback date in the mock data
 *  so filters return sensible results without depending on real `new Date()`. */
function pickToday(records: typeof FEEDBACK) {
  return records.reduce((max, f) => (f.date > max ? f.date : max), "1970-01-01");
}

function matchesDate(date: string, filter: DateFilter, today: string): boolean {
  if (filter === "all") return true;
  const d = new Date(date);
  const t = new Date(today);
  const diffMs = t.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (filter === "today") return date === today;
  if (filter === "7d")    return diffDays >= 0 && diffDays <= 6;   // include today + 6 days back
  if (filter === "30d")   return diffDays >= 0 && diffDays <= 29;

  const yearD = d.getFullYear();
  const monthD = d.getMonth();
  const yearT = t.getFullYear();
  const monthT = t.getMonth();

  if (filter === "month")
    return yearD === yearT && monthD === monthT;

  if (filter === "lastmonth") {
    const lastMonth = (monthT - 1 + 12) % 12;
    const lastYear  = monthT === 0 ? yearT - 1 : yearT;
    return yearD === lastYear && monthD === lastMonth;
  }
  return true;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5" fill={i < rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => pickToday(FEEDBACK), []);

  const filtered = useMemo(
    () => FEEDBACK.filter(f => matchesDate(f.date, dateFilter, today)),
    [dateFilter, today]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Reset to page 1 whenever the filter changes.
  useEffect(() => setPage(1), [dateFilter]);

  // Clamp page if filter shrinks total pages
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const avg =
    filtered.length > 0
      ? (filtered.reduce((s, f) => s + f.rating, 0) / filtered.length).toFixed(1)
      : "—";

  // Close filter dropdown on outside click / Escape
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

  const activeOption = DATE_OPTIONS.find(o => o.value === dateFilter)!;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Feedback & Rate"
        subtitle={`${filtered.length} of ${FEEDBACK.length} entries${
          dateFilter === "all" ? "" : ` · ${activeOption.label.toLowerCase()}`
        }`}
      />

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
          <div className="text-[13px] text-gray-500">Average rating</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-gray-900">{avg}</span>
            {avg !== "—" && <Stars rating={Math.round(+avg)} />}
          </div>
        </div>
        {[5, 4, 3].map(n => (
          <div key={n} className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
            <div className="text-[13px] text-gray-500">{n} stars</div>
            <div className="text-2xl font-semibold text-gray-900 mt-2">
              {filtered.filter(f => f.rating === n).length}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Customer feedback</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === 0
                ? "No feedback in this range"
                : `Showing ${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </div>
          </div>

          {/* Date filter dropdown */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen(o => !o)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-gray-700",
                filterOpen
                  ? "bg-gray-50 border-gray-300"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>
                <span className="text-gray-500">Date:</span>{" "}
                <span className="font-medium">{activeOption.label}</span>
              </span>
              <ChevronDown
                className={cn("w-3.5 h-3.5 text-gray-400 transition", filterOpen && "rotate-180")}
              />
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                {DATE_OPTIONS.map(opt => {
                  const active = opt.value === dateFilter;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setDateFilter(opt.value);
                        setFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                        active
                          ? "bg-brand-50 text-brand-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span>{opt.label}</span>
                      {active && <Check className="w-4 h-4 text-brand-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-medium text-gray-900">No feedback in this range</div>
            <div className="text-xs text-gray-500 mt-1">
              Try a wider date filter or switch to All time.
            </div>
            {dateFilter !== "all" && (
              <button
                onClick={() => setDateFilter("all")}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["ID", "Customer", "Rating", "Comment", "Date"].map(h => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-[12px] font-medium text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(f => (
                <tr
                  key={f.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{f.id}</td>
                  <td className="px-6 py-3.5 font-medium text-gray-900">{f.customer}</td>
                  <td className="px-6 py-3.5">
                    <Stars rating={f.rating} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">{f.text}</td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs">{f.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
            <div>
              Showing <span className="font-medium text-gray-700">{startIdx + 1}</span>–
              <span className="font-medium text-gray-700">
                {Math.min(startIdx + PAGE_SIZE, filtered.length)}
              </span>{" "}
              of <span className="font-medium text-gray-700">{filtered.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numbered page buttons */}
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
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
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
