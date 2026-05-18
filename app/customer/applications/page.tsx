"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  APPLICATIONS,
  BRANCHES,
  USERS,
  CUSTOMERS,
  PRODUCTS,
  type Application,
  type LoanProduct,
} from "@/lib/data";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Plus,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Calendar,
  CircleDollarSign,
  FileText,
  MapPin,
  Briefcase,
  Users as UsersIcon,
  Package,
  Percent,
} from "lucide-react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Apr 21, 2026" → "2026-04-21"; returns null when unparseable. */
function toIso(str: string): string | null {
  const m = str.match(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]);
  if (month < 0) return null;
  return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** Today as "Apr 21, 2026" to match the mock data format. */
function formatToday(): string {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type Filters = {
  branches:  string[];
  products:  string[];
  officers:  string[];
  dateFrom:  string;
  dateTo:    string;
  amountMin: string;
  amountMax: string;
};

const EMPTY_FILTERS: Filters = {
  branches: [], products: [], officers: [],
  dateFrom: "", dateTo: "",
  amountMin: "", amountMax: "",
};

const PAGE_SIZE = 8;

export default function ApplicationsPage() {
  const { can, user } = useRole();

  const [list, setList]       = useState<Application[]>(APPLICATIONS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [query, setQuery]     = useState("");
  const [page, setPage]       = useState(1);

  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // ---- filtered list ----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(a => {
      if (q && !`${a.id} ${a.name} ${a.product} ${a.officer}`.toLowerCase().includes(q))
        return false;
      if (filters.branches.length && !filters.branches.includes(a.branch)) return false;
      if (filters.products.length && !filters.products.includes(a.product)) return false;
      if (filters.officers.length && !filters.officers.includes(a.officer)) return false;
      if (filters.amountMin && a.amount < +filters.amountMin) return false;
      if (filters.amountMax && a.amount > +filters.amountMax) return false;
      if (filters.dateFrom || filters.dateTo) {
        const iso = toIso(a.sent);
        if (iso) {
          if (filters.dateFrom && iso < filters.dateFrom) return false;
          if (filters.dateTo && iso > filters.dateTo) return false;
        }
      }
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
    (filters.branches.length  ? 1 : 0) +
    (filters.products.length  ? 1 : 0) +
    (filters.officers.length  ? 1 : 0) +
    (filters.dateFrom || filters.dateTo   ? 1 : 0) +
    (filters.amountMin || filters.amountMax ? 1 : 0);

  // ---- next id ----
  const nextId = useMemo(() => {
    const maxN = list.reduce((m, a) => {
      const n = parseInt(a.id.replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `APP-${maxN + 1}`;
  }, [list]);

  const handleCreate = (a: Application) => {
    setList(prev => [a, ...prev]);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Loan Applications"
        subtitle="Review and process all customer loan applications"
        actions={
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700">
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All applications</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === 0
                ? "No applications"
                : `Showing ${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-56"
              />
            </div>

            <AdvancedFilterPopover
              open={filterOpen}
              onOpenChange={setFilterOpen}
              filters={filters}
              onChange={setFilters}
              activeCount={activeFilterCount}
            />

            {can("loan.create") && (
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                New Application
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="px-6 py-2.5 bg-gray-50/60 border-b border-gray-200 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-500">Filters:</span>
            {filters.branches.length > 0 && (
              <Chip
                label={`Branch: ${filters.branches.length === 1 ? filters.branches[0] : `${filters.branches.length} selected`}`}
                onClear={() => setFilters(f => ({ ...f, branches: [] }))}
              />
            )}
            {filters.products.length > 0 && (
              <Chip
                label={`Product: ${filters.products.length === 1 ? filters.products[0] : `${filters.products.length} selected`}`}
                onClear={() => setFilters(f => ({ ...f, products: [] }))}
              />
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <Chip
                label={`Date: ${filters.dateFrom || "any"} → ${filters.dateTo || "any"}`}
                onClear={() => setFilters(f => ({ ...f, dateFrom: "", dateTo: "" }))}
              />
            )}
            {(filters.amountMin || filters.amountMax) && (
              <Chip
                label={`Amount: $${filters.amountMin || "0"} – $${filters.amountMax || "∞"}`}
                onClear={() => setFilters(f => ({ ...f, amountMin: "", amountMax: "" }))}
              />
            )}
            {filters.officers.length > 0 && (
              <Chip
                label={`Officer: ${filters.officers.length === 1 ? filters.officers[0] : `${filters.officers.length} selected`}`}
                onClear={() => setFilters(f => ({ ...f, officers: [] }))}
              />
            )}
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-[11px] text-brand-600 hover:underline font-medium ml-1"
            >
              Clear all
            </button>
          </div>
        )}

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {["App ID", "Customer", "Branch", "Loan range", "Applied", "Status"].map(h => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-[12px] font-medium text-gray-500"
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
                {paginated.map(r => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{r.id}</td>
                    <td className="px-6 py-3.5 text-gray-900 font-medium">{r.name}</td>
                    <td className="px-6 py-3.5 text-gray-600">{r.branch}</td>
                    <td className="px-6 py-3.5 text-gray-700">{r.range}</td>
                    <td className="px-6 py-3.5 text-gray-600">{r.sent}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={r.status} />
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
                ))}
              </tbody>
            </table>
          </div>
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

      <NewApplicationModal
        open={createOpen}
        nextId={nextId}
        currentOfficer={user.name}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />
    </div>
  );
}

/* ---------- chip ---------- */

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-medium border border-brand-100">
      {label}
      <button onClick={onClear} className="hover:bg-brand-100 rounded-full p-0.5">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

/* ====================================================================
   Advanced filter popover
   ==================================================================== */

function AdvancedFilterPopover({
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
  const [draft, setDraft] = useState<Filters>(filters);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

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

  const apply = () => {
    onChange(draft);
    onOpenChange(false);
  };
  const reset = () => setDraft(EMPTY_FILTERS);

  const toggle = (key: keyof Pick<Filters, "branches" | "products" | "officers">, value: string) => {
    setDraft(d => {
      const list = d[key];
      const next = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
      return { ...d, [key]: next };
    });
  };

  const productNames = Array.from(new Set(APPLICATIONS.map(a => a.product))).sort();
  const officerNames = Array.from(new Set(APPLICATIONS.map(a => a.officer))).sort();

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
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-white border border-gray-200 rounded-lg shadow-xl z-30">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="font-semibold text-sm text-gray-900">Advanced filter</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Advanced filter to narrow by branch, product, date range, amount, officer.
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
            {/* Branch */}
            <FilterGroup
              icon={MapPin}
              title="Branch"
              count={draft.branches.length}
            >
              <div className="space-y-1">
                {BRANCHES.map(b => (
                  <CheckRow
                    key={b.id}
                    label={b.name}
                    checked={draft.branches.includes(b.name)}
                    onChange={() => toggle("branches", b.name)}
                  />
                ))}
              </div>
            </FilterGroup>

            {/* Product */}
            <FilterGroup
               icon={Package}
               title="Product"
               count={draft.products.length}
            >
              <div className="flex flex-wrap gap-1.5">
                {productNames.map(p => {
                  const active = draft.products.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => toggle("products", p)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-full border",
                        active
                          ? "bg-brand-600 border-brand-600 text-white"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            {/* Date range */}
            <FilterGroup
              icon={Calendar}
              title="Date range"
              count={(draft.dateFrom || draft.dateTo) ? 1 : 0}
            >
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={draft.dateFrom}
                  onChange={e => setDraft(d => ({ ...d, dateFrom: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  value={draft.dateTo}
                  onChange={e => setDraft(d => ({ ...d, dateTo: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </FilterGroup>

            {/* Amount range */}
            <FilterGroup
              icon={CircleDollarSign}
              title="Amount (USD)"
              count={(draft.amountMin || draft.amountMax) ? 1 : 0}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={draft.amountMin}
                    onChange={e => setDraft(d => ({ ...d, amountMin: e.target.value }))}
                    className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <span className="text-gray-400 text-xs">to</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draft.amountMax}
                    onChange={e => setDraft(d => ({ ...d, amountMax: e.target.value }))}
                    className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            </FilterGroup>

            {/* Officer */}
            <FilterGroup
              icon={UsersIcon}
              title="Officer"
              count={draft.officers.length}
            >
              <div className="space-y-1">
                {officerNames.map(o => (
                  <CheckRow
                    key={o}
                    label={o}
                    checked={draft.officers.includes(o)}
                    onChange={() => toggle("officers", o)}
                  />
                ))}
              </div>
            </FilterGroup>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50/60 rounded-b-lg">
            <button
              onClick={reset}
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Reset all
            </button>
            <button
              onClick={apply}
              className="px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-500">
          <Icon className="w-3 h-3" />
          {title}
        </div>
        {count > 0 && (
          <span className="text-[10px] font-medium bg-brand-50 text-brand-700 rounded-full px-1.5 py-0.5">
            {count} selected
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-gray-50 cursor-pointer">
      <div
        className={cn(
          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
          checked ? "bg-brand-600 border-brand-600 text-white" : "border-gray-300 bg-white"
        )}
      >
        {checked && <Check className="w-3 h-3" />}
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span className="text-xs text-gray-700">{label}</span>
    </label>
  );
}

/* ====================================================================
   New Application modal
   ==================================================================== */

function NewApplicationModal({
  open,
  nextId,
  currentOfficer,
  onClose,
  onSave,
}: {
  open: boolean;
  nextId: string;
  currentOfficer: string;
  onClose: () => void;
  onSave: (a: Application) => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");
  const [rate, setRate] = useState("");
  const [officer, setOfficer] = useState(currentOfficer);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Auto-reset when opened
  useEffect(() => {
    if (open) {
      setCustomerId("");
      setCustomerSearch("");
      setProductId("");
      setAmount("");
      setTerm("");
      setRate("");
      setOfficer(currentOfficer);
      setNotes("");
      setError(null);
    }
  }, [open, currentOfficer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const customer = CUSTOMERS.find(c => c.id === customerId);
  const product: LoanProduct | undefined = PRODUCTS.find(p => p.id === productId);

  // Auto-fill rate when product is picked
  const pickProduct = (id: string) => {
    setProductId(id);
    const p = PRODUCTS.find(p => p.id === id);
    if (p) {
      setRate(((p.rateMin + p.rateMax) / 2).toFixed(1));
      if (!amount) setAmount(String(p.min));
      if (!term) setTerm(String(p.termMin));
    }
  };

  const filteredCustomers = customerSearch
    ? CUSTOMERS.filter(
        c =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch) ||
          c.id.toLowerCase().includes(customerSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const validate = (): string | null => {
    if (!customer) return "Please select a customer.";
    if (!product) return "Please pick a loan product.";
    const a = +amount;
    if (!a || a < product.min || a > product.max)
      return `Amount must be between $${product.min} and $${product.max} for ${product.name}.`;
    const t = +term;
    if (!t || t < product.termMin || t > product.termMax)
      return `Term must be between ${product.termMin} and ${product.termMax} months.`;
    const r = +rate;
    if (!r || r < product.rateMin || r > product.rateMax)
      return `Rate must be between ${product.rateMin}% and ${product.rateMax}%.`;
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return setError(err);
    if (!customer || !product) return;
    const a: Application = {
      id: nextId,
      cid: customer.id,
      name: customer.name,
      product: product.name,
      amount: +amount,
      term: +term,
      rate: +rate,
      score: 700, // default — would come from a CBC API in production
      branch: customer.branch,
      range: `$${(+amount).toLocaleString()}`,
      sent: formatToday(),
      officer,
      status: "Pending",
    };
    onSave(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900">New loan application</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Submitted as{" "}
              <span className="font-mono text-gray-700">{nextId}</span>. Status will start in{" "}
              <span className="font-medium">Pending</span>.
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

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {error && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Customer */}
          <Section icon={UsersIcon} title="Customer" hint="Pick an existing customer record.">
            {customer ? (
              <div className="flex items-center gap-3 p-3 border border-brand-200 bg-brand-50/40 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {customer.name.split(" ").map(s => s[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {customer.id} · {customer.phone} · {customer.branch}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCustomerId("");
                    setCustomerSearch("");
                  }}
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search by name, phone, or ID..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                {filteredCustomers.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-md max-h-48 overflow-y-auto scrollbar-thin bg-white">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomerId(c.id);
                          setCustomerSearch("");
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 border-b border-gray-100 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold flex items-center justify-center">
                          {c.name.split(" ").map(s => s[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{c.name}</div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {c.id} · {c.phone} · {c.branch}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Loan details */}
          <Section icon={CircleDollarSign} title="Loan details" hint="Pick a product to auto-fill the rate range.">
            <Field label="Loan product">
              <select
                value={productId}
                onChange={e => pickProduct(e.target.value)}
                className="form-input"
              >
                <option value="">Select a product…</option>
                {PRODUCTS.filter(p => p.status === "active").map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} · ${p.min}–${p.max} · {p.rateMin}–{p.rateMax}%
                  </option>
                ))}
              </select>
            </Field>
            {product && (
              <div className="text-[11px] text-gray-500 -mt-1.5 ml-9 pl-0">
                {product.description}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <Field
                label="Amount (USD)"
                hint={product ? `Range $${product.min} – $${product.max}` : undefined}
              >
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="2500"
                  className="form-input"
                  disabled={!product}
                />
              </Field>
              <Field
                label="Term (months)"
                hint={product ? `Range ${product.termMin} – ${product.termMax}` : undefined}
              >
                <input
                  type="number"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  placeholder="12"
                  className="form-input"
                  disabled={!product}
                />
              </Field>
              <Field
                label="Rate (% APR)"
                hint={product ? `Range ${product.rateMin}% – ${product.rateMax}%` : undefined}
              >
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  placeholder="14.5"
                  className="form-input"
                  disabled={!product}
                />
              </Field>
            </div>
          </Section>

          {/* Assignment */}
          <Section icon={Briefcase} title="Person in charge" hint="Officer who will own this application.">
            <select
              value={officer}
              onChange={e => setOfficer(e.target.value)}
              className="form-input"
            >
              {USERS.filter(u => u.status === "Active").map(u => (
                <option key={u.id} value={u.name}>
                  {u.name} — {u.role} · {u.branch}
                </option>
              ))}
            </select>
          </Section>

          {/* Notes */}
          <Section icon={FileText} title="Notes (optional)" hint="Internal context for reviewers.">
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Customer has been with us for 2 years, on-time history."
              className="form-input resize-none"
            />
          </Section>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Submitting will route the application for review.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              Submit application
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background: white;
          outline: none;
        }
        :global(.form-input:focus) {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
        }
        :global(.form-input:disabled) {
          background: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {hint && <div className="text-xs text-gray-500">{hint}</div>}
        </div>
      </div>
      <div className="space-y-3 ml-9">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="mt-1">{children}</div>
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}
