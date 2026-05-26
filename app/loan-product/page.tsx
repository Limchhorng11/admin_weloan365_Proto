"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  PRODUCTS,
  MWL_COUNTRIES,
  type LoanProduct,
  type MwlCountry,
} from "@/lib/data";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  FileText,
  Check,
  CircleDollarSign,
  Percent,
  Calendar,
  ShieldCheck,
  Files,
  Pencil,
  Globe,
  CornerDownRight,
} from "lucide-react";

type StatusFilter = "all" | "active" | "draft";

type Filters = {
  status: StatusFilter;
  amountMin: string;
  amountMax: string;
  rateMin: string;
  rateMax: string;
};

const EMPTY_FILTERS: Filters = {
  status: "all",
  amountMin: "",
  amountMax: "",
  rateMin: "",
  rateMax: "",
};

export default function ProductsPage() {
  const { can } = useRole();
  const mayEdit = can("setting.edit");

  const [products, setProducts] = useState<LoanProduct[]>(PRODUCTS);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const detail = detailId ? products.find(p => p.id === detailId) ?? null : null;

  // Apply filters + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const aMin = filters.amountMin ? +filters.amountMin : null;
    const aMax = filters.amountMax ? +filters.amountMax : null;
    const rMin = filters.rateMin   ? +filters.rateMin   : null;
    const rMax = filters.rateMax   ? +filters.rateMax   : null;
    return products.filter(p => {
      if (q && !`${p.name} ${p.id} ${p.description}`.toLowerCase().includes(q)) return false;
      if (filters.status !== "all" && p.status !== filters.status) return false;
      // Amount filter: product's range overlaps with [aMin..aMax]
      if (aMin !== null && p.max < aMin) return false;
      if (aMax !== null && p.min > aMax) return false;
      // Rate filter: product's rate range overlaps with [rMin..rMax]
      if (rMin !== null && p.rateMax < rMin) return false;
      if (rMax !== null && p.rateMin > rMax) return false;
      return true;
    });
  }, [products, query, filters]);

  // Generate next product ID (LP-XX). Only counts top-level IDs (no suffix
  // like "-KR") so the numeric sequence stays clean.
  const nextId = useMemo(() => {
    const max = products.reduce((m, p) => {
      // Match exactly LP-<digits> — skip country-sub records like LP-06-KR.
      const match = p.id.match(/^LP-(\d+)$/);
      if (!match) return m;
      const n = parseInt(match[1], 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `LP-${String(max + 1).padStart(2, "0")}`;
  }, [products]);

  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.amountMin || filters.amountMax ? 1 : 0) +
    (filters.rateMin   || filters.rateMax   ? 1 : 0);

  // Accepts one product (Non-MWL flow) or many (MWL flow saves the parent
  // and one sub-product per selected country in a single call).
  const handleSaveProduct = (next: LoanProduct | LoanProduct[]) => {
    const list = Array.isArray(next) ? next : [next];
    setProducts(prev => [...list, ...prev]);
    setCreateOpen(false);
  };

  const handleUpdateStatus = (id: string, next: "active" | "draft") => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, status: next } : p)));
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Loan Products"
        subtitle="Management of all loan products + detail"
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All products</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === products.length
                ? `${products.length} products`
                : `${filtered.length} of ${products.length} products`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-56"
              />
            </div>

            <FilterPopover
              open={filterOpen}
              onOpenChange={setFilterOpen}
              filters={filters}
              onChange={setFilters}
              activeCount={activeFilterCount}
            />

            {mayEdit && (
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Product
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="px-6 py-2.5 bg-gray-50/60 border-b border-gray-200 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-500">Filters:</span>
            {filters.status !== "all" && (
              <Chip
                label={`Status: ${filters.status === "active" ? "Active" : "Draft"}`}
                onClear={() => setFilters(f => ({ ...f, status: "all" }))}
              />
            )}
            {(filters.amountMin || filters.amountMax) && (
              <Chip
                label={`Amount: $${filters.amountMin || "0"} – $${filters.amountMax || "∞"}`}
                onClear={() => setFilters(f => ({ ...f, amountMin: "", amountMax: "" }))}
              />
            )}
            {(filters.rateMin || filters.rateMax) && (
              <Chip
                label={`Rate: ${filters.rateMin || "0"}% – ${filters.rateMax || "∞"}%`}
                onClear={() => setFilters(f => ({ ...f, rateMin: "", rateMax: "" }))}
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
            <div className="text-sm font-medium text-gray-900">No products match</div>
            <div className="text-xs text-gray-500 mt-1">
              Try adjusting your search or filters.
            </div>
            {(query || activeFilterCount > 0) && (
              <button
                onClick={() => {
                  setQuery("");
                  setFilters(EMPTY_FILTERS);
                }}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50"
              >
                Clear search & filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Name", "Amount range", "Rate", "Term", "Active loans", "Status"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">
                    {h}
                  </th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {sortForGrouping(filtered, products).map(p => {
                const isParent = p.kind === "mwl-parent";
                const isSub = p.kind === "mwl-sub";
                const country = isSub
                  ? MWL_COUNTRIES.find(c => c.code === p.country)
                  : undefined;
                // MWL sub-products: count siblings to show "X countries" on parent.
                const childCount = isParent
                  ? products.filter(x => x.parentId === p.id).length
                  : 0;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {isSub && (
                          <CornerDownRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )}
                        {country && <span className="text-base">{country.flag}</span>}
                        <span
                          className={cn(
                            "font-medium text-gray-900",
                            isSub && "ml-0",
                          )}
                        >
                          {p.name}
                        </span>
                        {isParent && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider border border-violet-100">
                            <Globe className="w-2.5 h-2.5" />
                            MWL · {childCount} {childCount === 1 ? "country" : "countries"}
                          </span>
                        )}
                        {isSub && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider border border-violet-100">
                            MWL sub
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-700">
                      ${p.min.toLocaleString()} – ${p.max.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-gray-700">
                      {p.rateMin}% – {p.rateMax}%
                    </td>
                    <td className="px-6 py-3.5 text-gray-700">
                      {p.termMin}–{p.termMax}m
                    </td>
                    <td className="px-6 py-3.5 text-gray-700">{p.loans}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={p.status === "active" ? "Active" : "Draft"} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setDetailId(p.id)}
                        className="text-xs text-brand-600 hover:underline font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CreateProductModal
        open={createOpen}
        nextId={nextId}
        onClose={() => setCreateOpen(false)}
        onSave={handleSaveProduct}
      />

      <DetailProductModal
        product={detail}
        onClose={() => setDetailId(null)}
        canEdit={mayEdit}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}

/* ---------- helpers ---------- */

/**
 * Keep MWL sub-products immediately under their parent so the table reads
 * top-down as a tree: Parent → KR sub → JP sub → SG sub → next product.
 * The visible list is the post-filter set; we look up the global product
 * list to find each item's siblings.
 */
function sortForGrouping(
  visible: LoanProduct[],
  all: LoanProduct[],
): LoanProduct[] {
  const visibleIds = new Set(visible.map(p => p.id));
  const out: LoanProduct[] = [];
  const seen = new Set<string>();
  for (const p of visible) {
    if (seen.has(p.id)) continue;
    // If it's a sub-product whose parent is in the visible set, the parent
    // will pull it in — skip here.
    if (p.kind === "mwl-sub" && p.parentId && visibleIds.has(p.parentId))
      continue;
    out.push(p);
    seen.add(p.id);
    if (p.kind === "mwl-parent") {
      // Append the matching sub-products (preserve their source order).
      for (const child of all) {
        if (
          child.parentId === p.id &&
          visibleIds.has(child.id) &&
          !seen.has(child.id)
        ) {
          out.push(child);
          seen.add(child.id);
        }
      }
    }
  }
  return out;
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

/* ---------- filter popover ---------- */

function FilterPopover({
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
  // Local draft state — only commits to parent on Apply
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
  const reset = () => {
    setDraft(EMPTY_FILTERS);
  };

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
        <ChevronDown
          className={cn("w-3 h-3 text-gray-400 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-gray-200 rounded-lg shadow-xl z-30">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="font-semibold text-sm text-gray-900">Filter products</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Filter products by status, amount, or rate range.
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Status */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">
                Status
              </div>
              <div className="flex items-center gap-1">
                {(["all", "active", "draft"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setDraft(d => ({ ...d, status: s }))}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-xs rounded-md border capitalize",
                      draft.status === s
                        ? "bg-brand-50 border-brand-300 text-brand-700 font-medium"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">
                Amount range (USD)
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
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
                    inputMode="numeric"
                    placeholder="Max"
                    value={draft.amountMax}
                    onChange={e => setDraft(d => ({ ...d, amountMax: e.target.value }))}
                    className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Rate */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">
                Rate range (APR)
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="Min"
                    value={draft.rateMin}
                    onChange={e => setDraft(d => ({ ...d, rateMin: e.target.value }))}
                    className="w-full pl-2 pr-6 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
                <span className="text-gray-400 text-xs">to</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="Max"
                    value={draft.rateMax}
                    onChange={e => setDraft(d => ({ ...d, rateMax: e.target.value }))}
                    className="w-full pl-2 pr-6 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50/60 rounded-b-lg">
            <button
              onClick={reset}
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Reset
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

/* ---------- create product modal (CMS-style) ---------- */

function CreateProductModal({
  open,
  nextId,
  onClose,
  onSave,
}: {
  open: boolean;
  nextId: string;
  onClose: () => void;
  onSave: (p: LoanProduct | LoanProduct[]) => void;
}) {
  // Tab: Non-MWL (default) shows the standard form; MWL adds a country
  // multi-select and saves one parent + one sub-product per chosen country.
  const [kind, setKind] = useState<"non-mwl" | "mwl">("non-mwl");
  const [countries, setCountries] = useState<MwlCountry[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [rateMin, setRateMin] = useState("");
  const [rateMax, setRateMax] = useState("");
  const [termMin, setTermMin] = useState("");
  const [termMax, setTermMax] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [requiredDocs, setRequiredDocs] = useState("");
  const [processingFee, setProcessingFee] = useState("1.5");
  const [latePenalty, setLatePenalty] = useState("2.0");
  const [earlyPayoff, setEarlyPayoff] = useState(true);
  const [status, setStatus] = useState<"active" | "draft">("draft");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setKind("non-mwl");
      setCountries([]);
      setName("");
      setDescription("");
      setMin("");
      setMax("");
      setRateMin("");
      setRateMax("");
      setTermMin("");
      setTermMax("");
      setEligibility("");
      setRequiredDocs("");
      setProcessingFee("1.5");
      setLatePenalty("2.0");
      setEarlyPayoff(true);
      setStatus("draft");
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

  const validate = (): string | null => {
    if (!name.trim()) return "Product name is required.";
    if (!description.trim()) return "Description is required.";
    const minN = +min, maxN = +max;
    if (!minN || !maxN || minN >= maxN) return "Amount range must be valid (min < max).";
    const rMinN = +rateMin, rMaxN = +rateMax;
    if (rMinN < 0 || rMaxN <= 0 || rMinN > rMaxN) return "Rate range must be valid.";
    const tMinN = +termMin, tMaxN = +termMax;
    if (!tMinN || !tMaxN || tMinN > tMaxN) return "Term range must be valid.";
    if (kind === "mwl" && countries.length === 0)
      return "Pick at least one destination country for this MWL product.";
    return null;
  };

  const submit = (publish: boolean) => {
    const err = validate();
    if (err) return setError(err);

    const base = {
      min: +min,
      max: +max,
      rateMin: +rateMin,
      rateMax: +rateMax,
      termMin: +termMin,
      termMax: +termMax,
      status: (publish ? "active" : "draft") as "active" | "draft",
      loans: 0,
      description: description.trim(),
      eligibility: eligibility.trim(),
      requiredDocs: requiredDocs.trim(),
      processingFee: +processingFee,
      latePenalty: +latePenalty,
      earlyPayoff,
    };

    if (kind === "non-mwl") {
      const product: LoanProduct = {
        ...base,
        id: nextId,
        name: name.trim(),
        kind: "non-mwl",
      };
      onSave(product);
      return;
    }

    // MWL → one parent product + one sub-product per selected country.
    const parentName = name.trim();
    const parent: LoanProduct = {
      ...base,
      id: nextId,
      name: parentName,
      kind: "mwl-parent",
    };
    const subs: LoanProduct[] = countries.map(code => {
      const meta = MWL_COUNTRIES.find(c => c.code === code)!;
      return {
        ...base,
        id: `${nextId}-${code}`,
        name: `${parentName} — ${meta.name}`,
        kind: "mwl-sub",
        country: code,
        parentId: nextId,
      };
    });
    onSave([parent, ...subs]);
  };

  const toggleCountry = (code: MwlCountry) =>
    setCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );

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
            <div className="text-base font-semibold text-gray-900">Create new loan product</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {kind === "non-mwl" ? (
                <>
                  New product will be created with ID{" "}
                  <span className="font-mono text-gray-700">{nextId}</span>.
                </>
              ) : (
                <>
                  New MWL parent with ID{" "}
                  <span className="font-mono text-gray-700">{nextId}</span>
                  {countries.length > 0 && (
                    <>
                      {" "}+{" "}
                      {countries
                        .map(c => `${nextId}-${c}`)
                        .join(", ")}{" "}
                      sub-product
                      {countries.length === 1 ? "" : "s"}
                    </>
                  )}
                  .
                </>
              )}
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

        {/* Product-kind tabs */}
        <div className="px-6 pt-4 border-b border-gray-200 flex gap-1">
          {(
            [
              { v: "non-mwl", l: "Non-MWL", hint: "Standard loan product" },
              { v: "mwl",     l: "MWL",     hint: "Migrant Worker Loan with country sub-products" },
            ] as const
          ).map(t => {
            const active = t.v === kind;
            return (
              <button
                key={t.v}
                type="button"
                onClick={() => setKind(t.v)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition",
                  active
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                )}
                aria-current={active ? "page" : undefined}
                title={t.hint}
              >
                {t.v === "mwl" && <Globe className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                {t.l}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {error && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* MWL-only: country picker — shown first since it drives how many
              sub-products get created. */}
          {kind === "mwl" && (
            <Section
              icon={Globe}
              title="Destination countries"
              hint="One MWL sub-product will be created for each country you pick. They inherit the fields below as defaults and can be edited individually later."
            >
              <div className="grid grid-cols-3 gap-2">
                {MWL_COUNTRIES.map(c => {
                  const checked = countries.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => toggleCountry(c.code)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition",
                        checked
                          ? "border-brand-500 bg-brand-50/60 text-brand-700"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                      )}
                    >
                      <span className="text-xl leading-none">{c.flag}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-tight">
                          {c.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500">
                          {c.code}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                          checked
                            ? "bg-brand-600 border-brand-600 text-white"
                            : "border-gray-300",
                        )}
                      >
                        {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {countries.length > 0 && (
                <div className="mt-3 px-3 py-2 rounded-md bg-violet-50/70 border border-violet-100 text-[11px] text-violet-800 leading-relaxed">
                  Will create <b>{countries.length + 1}</b> records on save:
                  the MWL parent <span className="font-mono">{nextId}</span> plus{" "}
                  {countries.map((c, i) => (
                    <span key={c}>
                      <span className="font-mono">
                        {nextId}-{c}
                      </span>
                      {i < countries.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  .
                </div>
              )}
            </Section>
          )}

          {/* Basic info */}
          <Section icon={FileText} title="Basic information" hint="Customer-facing copy. Shown in the mobile app and web portal.">
            <Field
              label={kind === "mwl" ? "MWL family name *" : "Product name *"}
              hint={
                kind === "mwl"
                  ? "Country sub-products are named '[Family name] — [Country]'."
                  : undefined
              }
            >
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={
                  kind === "mwl"
                    ? "e.g. Migrant Worker Loan"
                    : "e.g. Home Improvement Loan"
                }
                className="form-input"
              />
            </Field>
            <Field
              label="Description *"
              hint={`Markdown supported. ${description.length} characters.`}
            >
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the product, target customer, and what makes it different. This text shows in the customer app's product catalog."
                className="form-input resize-none"
              />
            </Field>
          </Section>

          {/* Financial terms */}
          <Section icon={CircleDollarSign} title="Financial terms" hint="Used to size and price loans under this product.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount minimum (USD)">
                <input type="number" value={min} onChange={e => setMin(e.target.value)} placeholder="500" className="form-input" />
              </Field>
              <Field label="Amount maximum (USD)">
                <input type="number" value={max} onChange={e => setMax(e.target.value)} placeholder="5000" className="form-input" />
              </Field>
              <Field label="Rate min (%)">
                <input type="number" step="0.1" value={rateMin} onChange={e => setRateMin(e.target.value)} placeholder="13.0" className="form-input" />
              </Field>
              <Field label="Rate max (%)">
                <input type="number" step="0.1" value={rateMax} onChange={e => setRateMax(e.target.value)} placeholder="15.5" className="form-input" />
              </Field>
              <Field label="Term min (months)">
                <input type="number" value={termMin} onChange={e => setTermMin(e.target.value)} placeholder="6" className="form-input" />
              </Field>
              <Field label="Term max (months)">
                <input type="number" value={termMax} onChange={e => setTermMax(e.target.value)} placeholder="24" className="form-input" />
              </Field>
              <Field label="Processing fee (%)">
                <input type="number" step="0.1" value={processingFee} onChange={e => setProcessingFee(e.target.value)} className="form-input" />
              </Field>
              <Field label="Late penalty (% / month)">
                <input type="number" step="0.1" value={latePenalty} onChange={e => setLatePenalty(e.target.value)} className="form-input" />
              </Field>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div>
                <div className="text-sm text-gray-900 font-medium">Allow early payoff</div>
                <div className="text-xs text-gray-500">Customers can repay early without a penalty.</div>
              </div>
              <Toggle checked={earlyPayoff} onChange={setEarlyPayoff} />
            </div>
          </Section>

          {/* Eligibility */}
          <Section icon={ShieldCheck} title="Eligibility criteria" hint="One requirement per line. Shown to customers before they apply.">
            <textarea
              rows={5}
              value={eligibility}
              onChange={e => setEligibility(e.target.value)}
              placeholder={"• Cambodian citizen\n• Age 21–60\n• Minimum monthly income $300"}
              className="form-input resize-none"
            />
          </Section>

          {/* Documents */}
          <Section icon={Files} title="Required documents" hint="One document per line.">
            <textarea
              rows={4}
              value={requiredDocs}
              onChange={e => setRequiredDocs(e.target.value)}
              placeholder={"National ID\nPayslip (last 3 months)\nBank statement (last 6 months)"}
              className="form-input resize-none"
            />
          </Section>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Status: <span className="font-medium">{status === "active" ? "Active" : "Draft"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={() => submit(false)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Save as draft
            </button>
            <button
              onClick={() => submit(true)}
              className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              Publish &amp; activate
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

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-10 h-5 rounded-full relative transition",
        checked ? "bg-brand-600" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 bg-white rounded-full h-4 w-4 transition",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

/* ---------- detail product modal ---------- */

function DetailProductModal({
  product,
  onClose,
  canEdit,
  onUpdateStatus,
}: {
  product: LoanProduct | null;
  onClose: () => void;
  canEdit: boolean;
  onUpdateStatus: (id: string, next: "active" | "draft") => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && product) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [product, onClose]);

  if (!product) return null;

  const linesOf = (s: string) =>
    s
      .split(/\r?\n/)
      .map(line => line.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl",
                product.kind === "mwl-parent" || product.kind === "mwl-sub"
                  ? "bg-violet-50 text-violet-600"
                  : "bg-brand-50 text-brand-600",
              )}
            >
              {product.kind === "mwl-sub" && product.country
                ? MWL_COUNTRIES.find(c => c.code === product.country)?.flag
                : product.kind === "mwl-parent"
                  ? <Globe className="w-5 h-5" />
                  : <CircleDollarSign className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-mono text-gray-500">{product.id}</div>
              <div className="text-lg font-semibold text-gray-900">{product.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <StatusBadge status={product.status === "active" ? "Active" : "Draft"} />
                <span>·</span>
                <span>{product.loans} active loans</span>
                {product.kind === "mwl-parent" && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider border border-violet-100">
                      <Globe className="w-2.5 h-2.5" />
                      MWL parent
                    </span>
                  </>
                )}
                {product.kind === "mwl-sub" && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider border border-violet-100">
                      MWL sub · {product.parentId}
                    </span>
                  </>
                )}
              </div>
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

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {/* Description */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">
              Description
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <Stat
              icon={CircleDollarSign}
              label="Amount range"
              value={`$${product.min.toLocaleString()} – $${product.max.toLocaleString()}`}
            />
            <Stat
              icon={Percent}
              label="Interest rate"
              value={`${product.rateMin}% – ${product.rateMax}% APR`}
            />
            <Stat
              icon={Calendar}
              label="Term"
              value={`${product.termMin} – ${product.termMax} months`}
            />
            <Stat
              icon={Percent}
              label="Processing fee"
              value={`${product.processingFee}%`}
            />
            <Stat
              icon={Percent}
              label="Late penalty"
              value={`${product.latePenalty}% / month`}
            />
            <Stat
              icon={product.earlyPayoff ? Check : X}
              label="Early payoff"
              value={product.earlyPayoff ? "Allowed" : "Not allowed"}
            />
          </div>

          {/* Eligibility */}
          {product.eligibility && (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Eligibility criteria
              </div>
              <ul className="space-y-1.5">
                {linesOf(product.eligibility).map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-1 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required documents */}
          {product.requiredDocs && (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <Files className="w-3 h-3" />
                Required documents
              </div>
              <div className="grid grid-cols-2 gap-2">
                {linesOf(product.requiredDocs).map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white">
                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                Edit
              </button>
              {product.status === "active" ? (
                <button
                  onClick={() => {
                    onUpdateStatus(product.id, "draft");
                    onClose();
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-amber-700 border border-amber-200 rounded-md hover:bg-amber-50"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => {
                    onUpdateStatus(product.id, "active");
                    onClose();
                  }}
                  className="px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Activate
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}
