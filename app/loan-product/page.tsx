"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  PRODUCTS,
  MWL_COUNTRIES,
  countryCodeFor,
  LOCALES,
  emptyLocalizedText,
  type LoanProduct,
  type Locale,
  type LocalizedText,
} from "@/lib/data";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  GripVertical,
  X,
  FileText,
  Check,
  CircleDollarSign,
  ShieldCheck,
  Pencil,
  Globe,
  Upload,
  Image as ImageIcon,
  Film,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

type StatusFilter = "all" | "active" | "inactive" | "draft";

// Single-axis filter. Amount and rate ranges were removed because the catalog
// has at most ~10 products at a time — easier to scan than to range-filter, and
// admins were almost never using those inputs in practice.
type Filters = {
  status: StatusFilter;
};

const EMPTY_FILTERS: Filters = {
  status: "all",
};

export default function ProductsPage() {
  const { can } = useRole();
  const mayEdit = can("setting.edit");

  const [products, setProducts] = useState<LoanProduct[]>(PRODUCTS);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Drag-and-drop reorder state — the id of the row currently being dragged
  // and the id of the row it's hovering over (used for the drop-indicator).
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Confirmation dialog after a drag reorder — "Moved X from position A to
  // B". Stays open (like the rest of the app's modals) until the admin
  // dismisses it, rather than auto-disappearing.
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

  // MWL country sub-rows are collapsed under their parent by default — the
  // chevron toggles a parent id in/out of this set. Keeps the table scannable
  // when there are several destination countries per parent.
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const detail = detailId ? products.find(p => p.id === detailId) ?? null : null;

  // Apply filters + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p => {
      if (
        q &&
        !`${p.name.km} ${p.name.en} ${p.id} ${p.description.km} ${p.description.en}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (filters.status !== "all" && p.status !== filters.status) return false;
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

  const activeFilterCount = filters.status !== "all" ? 1 : 0;

  // Accepts one product (Non-MWL flow) or many (MWL flow saves the parent
  // and one sub-product per selected country in a single call).
  const handleSaveProduct = (next: LoanProduct | LoanProduct[]) => {
    const list = Array.isArray(next) ? next : [next];
    setProducts(prev => {
      // Replace by id when it already exists (edit flow), otherwise prepend (create flow).
      const existingIds = new Set(prev.map(p => p.id));
      const updates = list.filter(p => existingIds.has(p.id));
      const inserts = list.filter(p => !existingIds.has(p.id));
      const merged = prev.map(p => updates.find(u => u.id === p.id) ?? p);
      return [...inserts, ...merged];
    });
    setCreateOpen(false);
    setEditingId(null);
  };

  // Edit click on the detail modal → close detail, open create-modal in edit mode.
  const handleEdit = (p: LoanProduct) => {
    setDetailId(null);
    setEditingId(p.id);
    setCreateOpen(true);
  };

  const handleUpdateStatus = (id: string, next: "active" | "inactive" | "draft") => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, status: next } : p)));
  };

  /* Reorder top-level products (non-MWL and MWL parent) via drag-and-drop.
   * MWL sub-products travel with their parent as one block and are never
   * dragged on their own. `dragged` is dropped immediately before `target`
   * (or to the very end when target is null). */
  const moveTopLevelTo = (draggedId: string, targetId: string | null) => {
    if (draggedId === targetId) return;
    // Computed from the current `products` snapshot rather than inside a
    // setProducts updater — the updater callback runs after this handler
    // returns, so a toast message assigned in there wouldn't be readable
    // here yet. A single drag gesture only calls this once, so reading the
    // render's own `products` value directly is safe.
    const blocks: LoanProduct[][] = [];
    for (const p of products) {
      if (p.kind === "mwl-sub") {
        const last = blocks[blocks.length - 1];
        if (last && last[0].id === p.parentId) last.push(p);
        else blocks.push([p]);
      } else {
        blocks.push([p]);
      }
    }
    const srcIdx = blocks.findIndex(b => b[0].id === draggedId);
    if (srcIdx === -1) return;
    const [moved] = blocks.splice(srcIdx, 1);
    if (targetId === null) {
      blocks.push(moved);
    } else {
      const dstIdx = blocks.findIndex(b => b[0].id === targetId);
      if (dstIdx === -1) {
        // Target vanished — restore original position.
        blocks.splice(srcIdx, 0, moved);
      } else {
        blocks.splice(dstIdx, 0, moved);
      }
    }
    const finalIdx = blocks.findIndex(b => b[0].id === draggedId);
    setProducts(blocks.flat());
    if (finalIdx !== -1 && finalIdx !== srcIdx) {
      setReorderNotice(`Moved "${moved[0].name.en}" from position ${srcIdx + 1} to ${finalIdx + 1}`);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Loan Products"
        subtitle="Management of all loan products + detail"
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All products</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === products.length
                ? `${products.length} products`
                : `${filtered.length} of ${products.length} products`}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-full sm:w-56"
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
                label={`Status: ${
                  filters.status === "active"
                    ? "Active"
                    : filters.status === "inactive"
                    ? "Inactive"
                    : "Draft"
                }`}
                onClear={() => setFilters(f => ({ ...f, status: "all" }))}
              />
            )}
            {/* Only the Status chip can appear here now — amount and rate
                range filters were removed. */}
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
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-16 px-3 py-3 text-left text-[12px] font-medium text-gray-500">
                  #
                </th>
                {["Name", "Amount range", "Rate", "Term", "Status"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Top-level (non-sub) IDs in their current global order — used
                // to derive the 1-based position number shown in the # column.
                const topLevelIds = products
                  .filter(p => p.kind !== "mwl-sub")
                  .map(p => p.id);
                // While searching, force every parent open so a matching
                // country sub-row isn't hidden behind a collapsed chevron.
                const isSearching = query.trim() !== "";
                return sortForGrouping(
                  filtered,
                  products,
                  isSearching ? null : expandedParents
                ).map(p => {
                const isParent = p.kind === "mwl-parent";
                const isSub    = p.kind === "mwl-sub";
                const country  = isSub
                  ? MWL_COUNTRIES.find(c => c.code === p.country)
                  : undefined;
                const childCount = isParent
                  ? products.filter(x => x.parentId === p.id).length
                  : 0;
                const isExpanded = isSearching || expandedParents.has(p.id);
                const topIdx = isSub ? -1 : topLevelIds.indexOf(p.id);
                const positionNumber = topIdx === -1 ? null : topIdx + 1;
                const isDragging = draggedId === p.id;
                const isDragOver = dragOverId === p.id && draggedId !== p.id && !isSub;

                // Cell-level tone: sub-rows read as nested data, lighter weight.
                const cellTone = isSub ? "text-gray-600" : "text-gray-700";

                // Drag handlers only apply to top-level rows.
                const dragProps = isSub
                  ? {}
                  : {
                      draggable: true,
                      onDragStart: (e: React.DragEvent) => {
                        setDraggedId(p.id);
                        e.dataTransfer.effectAllowed = "move";
                        // Some browsers need data to be set or drag aborts.
                        e.dataTransfer.setData("text/plain", p.id);
                      },
                      onDragOver: (e: React.DragEvent) => {
                        if (!draggedId || draggedId === p.id) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverId !== p.id) setDragOverId(p.id);
                      },
                      onDragLeave: () => {
                        if (dragOverId === p.id) setDragOverId(null);
                      },
                      onDrop: (e: React.DragEvent) => {
                        e.preventDefault();
                        if (draggedId && draggedId !== p.id) {
                          moveTopLevelTo(draggedId, p.id);
                        }
                        setDraggedId(null);
                        setDragOverId(null);
                      },
                      onDragEnd: () => {
                        setDraggedId(null);
                        setDragOverId(null);
                      },
                    };

                return (
                  <tr
                    key={p.id}
                    {...dragProps}
                    className={cn(
                      "border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition",
                      isSub && "bg-gray-50/30",
                      isDragging && "opacity-40",
                      // Subtle top accent on the row being dragged-over so the
                      // drop target is obvious.
                      isDragOver && "ring-2 ring-inset ring-brand-300 bg-brand-50/40"
                    )}
                  >
                    {/* Reorder + position cell — drag handle and 1-based number
                       for top-level products. Sub-products show an empty cell. */}
                    <td className="w-16 px-3 py-3 align-middle">
                      {!isSub && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label="Drag to reorder"
                            title="Drag to reorder"
                            className="p-0.5 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-medium text-gray-500 tabular-nums">
                            {positionNumber}
                          </span>
                        </div>
                      )}
                    </td>
                    {/* Name cell — indented + tree connector for sub-products */}
                    <td className={cn("py-3", isSub ? "pl-12 pr-6" : "px-6")}>
                      <div className="flex items-center gap-2 min-w-0">
                        {isSub && (
                          <span
                            className="text-gray-300 select-none flex-shrink-0"
                            aria-hidden="true"
                          >
                            └
                          </span>
                        )}
                        {isSub && p.country && (
                          <span
                            className="text-[10px] font-medium uppercase tracking-wider text-gray-500 flex-shrink-0"
                            title={country?.name ?? p.country}
                          >
                            {p.country}
                          </span>
                        )}
                        <span
                          className={cn(
                            "truncate",
                            isSub ? "text-gray-700 text-sm" : "font-medium text-gray-900"
                          )}
                        >
                          {p.name.en}
                        </span>
                        {isParent && childCount > 0 && (
                          <button
                            type="button"
                            aria-label={isExpanded ? "Collapse countries" : "Expand countries"}
                            aria-expanded={isExpanded}
                            onClick={e => {
                              e.stopPropagation();
                              toggleExpanded(p.id);
                            }}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 -my-0.5 rounded text-[11px] text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex-shrink-0"
                          >
                            · {childCount} {childCount === 1 ? "country" : "countries"}
                            <ChevronDown
                              className={cn(
                                "w-3.5 h-3.5 transition-transform",
                                !isExpanded && "-rotate-90"
                              )}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={cn("px-6 py-3", cellTone)}>
                      {!isSub && (
                        p.min === p.max
                          ? `$${p.max.toLocaleString()}`
                          : `$${p.min.toLocaleString()} – $${p.max.toLocaleString()}`
                      )}
                    </td>
                    <td className={cn("px-6 py-3", cellTone)}>
                      {!isSub && (
                        p.rateMin === p.rateMax
                          ? `${p.rateMax}%`
                          : `${p.rateMin}% – ${p.rateMax}%`
                      )}
                    </td>
                    <td className={cn("px-6 py-3", cellTone)}>
                      {!isSub && (
                        p.termMin === p.termMax
                          ? `${p.termMax}m`
                          : `${p.termMin}–${p.termMax}m`
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge
                        status={
                          p.status === "active"
                            ? "Active"
                            : p.status === "inactive"
                            ? "Inactive"
                            : "Draft"
                        }
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setDetailId(p.id)}
                        className="text-xs text-brand-600 hover:underline font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              });
              })()}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <CreateProductModal
        open={createOpen}
        nextId={nextId}
        editing={editingId ? products.find(p => p.id === editingId) ?? null : null}
        onClose={() => {
          setCreateOpen(false);
          setEditingId(null);
        }}
        onSave={handleSaveProduct}
      />

      <DetailProductModal
        product={detail}
        onClose={() => setDetailId(null)}
        canEdit={mayEdit}
        onUpdateStatus={handleUpdateStatus}
        onEdit={handleEdit}
      />

      {reorderNotice && (
        <ReorderConfirmDialog
          message={reorderNotice}
          onConfirm={() => setReorderNotice(null)}
        />
      )}
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
  // Parent ids whose country sub-rows should be appended. `null` means
  // "expand every parent" (used while a search query is active).
  expandedParents: Set<string> | null,
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
    const isExpanded = expandedParents === null || expandedParents.has(p.id);
    if (p.kind === "mwl-parent" && isExpanded) {
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

/* ---------- reorder confirm dialog ---------- */

// Matches the app's standard modal shell (fixed backdrop + centered white
// card, see ConfirmDialog in components/users-roles-view.tsx) rather than a
// toast — the reorder already happened, so this is an acknowledgement, not
// a yes/no choice, hence the single Confirm action.
function ReorderConfirmDialog({
  message,
  onConfirm,
}: {
  message: string;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
      onClick={onConfirm}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">Order updated</div>
              <div className="text-xs text-gray-600 mt-1">{message}</div>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
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
  // No draft buffering anymore — with only one facet left (Status), changes
  // commit to the parent immediately so the table re-filters on click.
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
        <ChevronDown
          className={cn("w-3 h-3 text-gray-400 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[260px] bg-white border border-gray-200 rounded-lg shadow-xl z-30">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="font-semibold text-sm text-gray-900">Filter products</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Filter by lifecycle status.
            </div>
          </div>

          <div className="p-4">
            {/* Status — single facet. Clicking a chip applies immediately;
                no Apply / Reset footer is needed. */}
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">
              Status
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(["all", "active", "inactive", "draft"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onChange({ status: s })}
                  className={cn(
                    "px-2 py-1.5 text-xs rounded-md border capitalize",
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

/* ---------- create / edit product modal (CMS-style) ---------- */

function CreateProductModal({
  open,
  nextId,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  nextId: string;
  /** When provided, modal opens in edit mode and prefills from this product. */
  editing?: LoanProduct | null;
  onClose: () => void;
  onSave: (p: LoanProduct | LoanProduct[]) => void;
}) {
  // Tab: Non-MWL (default) shows the standard form; MWL adds an
  // open-ended list of destination countries and saves one parent +
  // one sub-product per added country.
  const [kind, setKind] = useState<"non-mwl" | "mwl">("non-mwl");
  const [countries, setCountries] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState("");
  const isEdit = !!editing;

  // Bilingual — same Khmer/English pattern as the Post editor.
  const [activeLocale, setActiveLocale] = useState<Locale>("km");
  const [nameMap, setNameMap] = useState<LocalizedText>(emptyLocalizedText());
  const [descItemsMap, setDescItemsMap] = useState<Record<Locale, string[]>>({ km: [], en: [] });
  const name = nameMap[activeLocale];
  const setName = (v: string) => setNameMap(prev => ({ ...prev, [activeLocale]: v }));
  const descItems = descItemsMap[activeLocale];
  const setDescItems = (items: string[]) =>
    setDescItemsMap(prev => ({ ...prev, [activeLocale]: items }));
  const [docItems, setDocItems] = useState<DocItem[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  // Thumbnail (3:4) — product list / carousel in the customer app. Image only.
  const [thumbnail, setThumbnail] = useState("");
  const thumbnailRef = useRef<HTMLInputElement>(null);
  // Detail image or video (1:1) — the product's own detail page in the customer app.
  const [detailImage, setDetailImage] = useState("");
  const [detailImageType, setDetailImageType] = useState<"image" | "video">("image");
  const detailImageRef = useRef<HTMLInputElement>(null);
  // Reference product icon — a small square image shown beside the name.
  const [icon, setIcon] = useState("");
  const iconRef = useRef<HTMLInputElement>(null);
  // Loan At A Glance — dynamic label/value rows. Defaults to the 4 standard
  // rows; admins can rename, remove, or add their own.
  const [glanceItems, setGlanceItems] = useState<GlanceItem[]>([]);
  // Key Feature / Eligibility — free-form sentence rows, composed into the
  // legacy multi-line strings on save.
  const [kfItems, setKfItems] = useState<string[]>([]);
  const [eligItems, setEligItems] = useState<string[]>([]);
  // status carries the persisted value of LoanProduct.status. The new
  // `activeNow` toggle is the form-level Active/Inactive switch that the
  // primary save button (Save / Update now) uses; "Save as draft" always
  // bypasses the toggle and forces status = "draft".
  const [status, setStatus] = useState<"active" | "inactive" | "draft">("draft");
  const [activeNow, setActiveNow] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // Edit mode — prefill every field from the existing product.
      setKind(editing.kind === "non-mwl" || !editing.kind ? "non-mwl" : "mwl");
      setCountries([]); // editing a single product, not adding new sub-products
      setCountryInput("");
      setNameMap(editing.name);
      setDescItemsMap({
        km: parseDescLines(editing.description.km),
        en: parseDescLines(editing.description.en),
      });
      setDocItems(
        editing.requiredDocuments?.length
          ? editing.requiredDocuments.map(d => ({ name: d.name, note: d.note, icon: d.icon }))
          : editing.requiredDocs
          ? editing.requiredDocs
              .split(/\r?\n/)
              .map(s => s.replace(/^[•\-]\s*/, "").trim())
              .filter(Boolean)
              .map(name => ({ name }))
          : []
      );
      setFaqItems(editing.faqs ? editing.faqs.map(f => ({ ...f })) : []);
      setThumbnail(editing.thumbnail ?? "");
      setDetailImage(editing.detailImage ?? "");
      setDetailImageType(editing.detailImageType ?? "image");
      setIcon(editing.icon ?? "");
      // Prefer saved dynamic rows; legacy products fall back to rows derived
      // from the structured numeric fields.
      setGlanceItems(
        editing.atAGlance?.length
          ? editing.atAGlance.map(g => ({ ...g }))
          : glanceRowsFromProduct(editing)
      );
      // One row per "• line" of the stored strings.
      setKfItems(linesToSentences(editing.keyFeatures));
      setEligItems(linesToSentences(editing.eligibility));
      setStatus(editing.status);
      setActiveNow(editing.status === "active");
      setError(null);
    } else {
      // Create mode — empty defaults, all rows visible.
      setKind("non-mwl");
      setCountries([]);
      setCountryInput("");
      setNameMap(emptyLocalizedText());
      setDescItemsMap({ km: [], en: [] });
      setDocItems([]);
      setFaqItems(DEFAULT_FAQS.map(f => ({ ...f })));
      setThumbnail("");
      setDetailImage("");
      setDetailImageType("image");
      setIcon("");
      setGlanceItems(DEFAULT_GLANCE_ROWS.map(g => ({ ...g })));
      setKfItems([...DEFAULT_KEY_FEATURES]);
      setEligItems([...DEFAULT_ELIGIBILITY]);
      setStatus("draft");
      // Default the toggle to Active on create so the primary "Save" button
      // publishes the product unless the admin explicitly flips it.
      setActiveNow(true);
      setError(null);
    }
    setActiveLocale("km");
  }, [open, editing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // For MWL mode we never create a new parent — new entries attach to the
  // existing Migrant Worker Loan family. Find that parent dynamically so the
  // form keeps working if the demo data is reshuffled.
  const mwlParent = PRODUCTS.find(p => p.kind === "mwl-parent");

  const validate = (): string | null => {
    // Name is required in all modes that show the field — i.e. anything except
    // create-MWL (which derives the name from the parent and the country).
    // Khmer is the required locale, same as the Post editor.
    if ((isEdit || kind === "non-mwl") && !nameMap.km.trim())
      return "Khmer product name is required.";
    if (!isEdit && kind === "mwl") {
      if (!mwlParent) return "No Migrant Worker Loan parent found to attach to.";
      if (countries.length === 0)
        return "Add at least one destination country for this MWL sub-product.";
    }
    return null;
  };

  // Compose the sentence rows into the legacy "• line" multi-line string.
  // Empty rows are excluded.
  const composeSentences = (items: string[]): string =>
    items
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => `• ${t}`)
      .join("\n");

  // Reverse of composeSentences — splits a stored "• line" string back into
  // editable rows. Used to prefill descItemsMap per locale on edit.
  const parseDescLines = (s: string): string[] =>
    s
      ? s
          .split(/\r?\n/)
          .map(x => x.replace(/^[•\-]\s*/, "").trim())
          .filter(Boolean)
      : [];

  const submit = (publish: boolean) => {
    const err = validate();
    if (err) return setError(err);

    // Rows missing a title or a value are dropped on save — same contract as
    // the old hidden rows, which saved as empty.
    const glance = glanceItems
      .map(g => ({ label: g.label.trim(), value: g.value.trim() }))
      .filter(g => g.label && g.value);
    // Best-effort numeric extraction from the free-form rows so the products
    // table and detail drawer keep rendering amount/rate/term. Unmatched or
    // unparsable rows save as 0 ("0–0"), same as the old hidden rows.
    const numbersIn = (s: string) =>
      (s.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
    const rowValue = (re: RegExp) =>
      glance.find(g => re.test(g.label))?.value ?? "";
    const amounts = numbersIn(rowValue(/amount|size/i));
    const rates = numbersIn(rowValue(/interest|rate/i));
    const terms = numbersIn(rowValue(/tenure|term/i));

    const base = {
      min: amounts[0] ?? 0,
      max: amounts[1] ?? amounts[0] ?? 0,
      rateMin: rates[0] ?? 0,
      rateMax: rates[1] ?? rates[0] ?? 0,
      termMin: terms[0] ?? 0,
      termMax: terms[1] ?? terms[0] ?? 0,
      // "Save as draft" → always draft.
      // Primary "Save" / "Update now" → uses the Active/Inactive toggle.
      status: (publish
        ? activeNow
          ? "active"
          : "inactive"
        : "draft") as "active" | "inactive" | "draft",
      loans: editing?.loans ?? 0,
      description: {
        km: composeSentences(descItemsMap.km),
        en: composeSentences(descItemsMap.en),
      },
      eligibility: composeSentences(eligItems),
      keyFeatures: composeSentences(kfItems) || undefined,
      requiredDocs: docItems.map(d => d.name).join("\n"),
      requiredDocuments: docItems.length
        ? docItems.map(d => ({
            name: d.name,
            note: d.note?.trim() || undefined,
            icon: d.icon || undefined,
          }))
        : undefined,
      faqs: faqItems.length
        ? faqItems.map(f => ({
            question: f.question.trim(),
            answer: f.answer.trim(),
          }))
        : undefined,
      processingFee: editing?.processingFee ?? 0,
      latePenalty: editing?.latePenalty ?? 0,
      // Early payoff is no longer offered — preserve existing value or default true.
      earlyPayoff: editing?.earlyPayoff ?? true,
      // Repayment method is no longer edited in the form — preserve existing value.
      repaymentMethod: editing?.repaymentMethod,
      // Purpose mirrors the matching glance row for backward compatibility.
      purpose: rowValue(/purpose/i) || undefined,
      atAGlance: glance.length ? glance : undefined,
      thumbnail: thumbnail || undefined,
      detailImage: detailImage || undefined,
      detailImageType: detailImage ? detailImageType : undefined,
      icon: icon || undefined,
    };

    const trimmedName: LocalizedText = { km: nameMap.km.trim(), en: nameMap.en.trim() };

    // EDIT mode — replace the existing product, keep its id/kind/parent/country.
    if (editing) {
      const updated: LoanProduct = {
        ...editing,
        ...base,
        name: trimmedName,
      };
      onSave(updated);
      return;
    }

    if (kind === "non-mwl") {
      const product: LoanProduct = {
        ...base,
        id: nextId,
        name: trimmedName,
        kind: "non-mwl",
      };
      onSave(product);
      return;
    }

    // MWL → no new parent. Attach one sub-product per added country to the
    // existing Migrant Worker Loan family.
    if (!mwlParent) return; // validate() already guards this; defensive only.
    const subs: LoanProduct[] = countries.map((country, idx) => {
      // Auto-derive the 2-letter overseas country code (KR/JP/SG-style).
      const code = countryCodeFor(country);
      return {
        ...base,
        // Generate distinct IDs so multiple added countries don't collide
        // with each other if the same nextId is reused on save.
        id: `${nextId}-${code}-${idx + 1}`,
        // Use the short "MWL" prefix to match existing sub-products
        // (MWL — Korea, MWL — Japan, …) rather than the parent's full name.
        // Auto-derived from the typed country name — English only, since
        // there's no per-locale authoring UI for these generated sub-products.
        name: { km: "", en: `MWL — ${country}` },
        kind: "mwl-sub",
        // Store the 2-letter code in the `country` field so the table badge
        // renders consistently regardless of whether the country existed in
        // MWL_COUNTRIES or was added free-form by an admin.
        country: code,
        parentId: mwlParent.id,
      };
    });
    onSave(subs);
  };

  // Add the typed country (deduped, trimmed, max ~40 chars).
  const commitCountry = () => {
    const v = countryInput.trim().slice(0, 40);
    if (!v) return;
    if (countries.some(c => c.toLowerCase() === v.toLowerCase())) {
      setCountryInput("");
      return;
    }
    setCountries(prev => [...prev, v]);
    setCountryInput("");
  };

  const removeCountry = (name: string) =>
    setCountries(prev => prev.filter(c => c !== name));

  const onThumbnailPick = () => thumbnailRef.current?.click();
  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the thumbnail.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setThumbnail(String(reader.result || ""));
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-picking the same file
    setError(null);
  };

  const onDetailImagePick = () => detailImageRef.current?.click();
  const onDetailImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Please choose an image or a video file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDetailImage(String(reader.result || ""));
      setDetailImageType(isVideo ? "video" : "image");
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const onIconPick = () => iconRef.current?.click();
  const onIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the product icon.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setIcon(String(reader.result || ""));
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-picking the same file
    setError(null);
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
            <div className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit loan product" : "Create new loan product"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {isEdit ? (
                <>
                  Editing{" "}
                  <span className="font-mono text-gray-700">{editing!.id}</span>{" "}
                  · changes save in place.
                </>
              ) : kind === "non-mwl" ? (
                <>
                  New product will be created with ID{" "}
                  <span className="font-mono text-gray-700">{nextId}</span>.
                </>
              ) : (
                <>
                  New MWL sub-product
                  {countries.length > 1 ? "s" : ""} will attach to{" "}
                  <span className="font-medium text-gray-700">
                    {mwlParent?.name.en ?? "Migrant Worker Loan"}
                  </span>
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

        {/* Product-kind tabs — hidden in edit mode (kind is immutable). */}
        {!isEdit && (
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
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {error && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <Section icon={FileText} title="Basic Information" hint="Customer-facing copy. Shown in the mobile app and web portal.">
            {/* Language tabs — Khmer required, English optional translation.
                Governs the Product name and Description fields below, same
                pattern as the Post editor. */}
            <div className="flex items-center gap-1.5">
              {LOCALES.map(l => {
                const active = activeLocale === l.code;
                const filled = !!nameMap[l.code].trim() || descItemsMap[l.code].some(s => s.trim());
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setActiveLocale(l.code)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border",
                      active
                        ? "bg-brand-50 border-brand-200 text-brand-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <span>{l.flag}</span>
                    {l.label}
                    {l.code === "km" && <span className="text-red-500">*</span>}
                    <span
                      title={filled ? "Filled in" : "Not filled in"}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        filled ? "bg-emerald-500" : "bg-gray-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <Field
              label="Reference product icon (42 × 42 px)"
              hint="Small icon shown beside the product name in the customer app. PNG or JPG."
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onIconPick}
                  title={icon ? "Replace icon" : "Upload icon"}
                  className={cn(
                    "w-16 h-16 rounded-md flex items-center justify-center overflow-hidden transition flex-shrink-0",
                    icon
                      ? "border border-gray-200 bg-white hover:border-brand-300"
                      : "border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 text-gray-500 hover:text-brand-700"
                  )}
                >
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={icon}
                      alt="product icon preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </button>
                {icon ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onIconPick}
                      className="text-xs text-brand-600 hover:underline font-medium"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setIcon("")}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">
                    Click to upload the reference product icon
                  </span>
                )}
              </div>
              <input
                ref={iconRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onIconChange}
              />
            </Field>

            {isEdit || kind === "non-mwl" ? (
              <Field label={`Product name${activeLocale === "km" ? " *" : ""}`}>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={
                    activeLocale === "km"
                      ? "e.g. Home Improvement Loan"
                      : `Translate the product name into ${LOCALES.find(l => l.code === activeLocale)?.label}`
                  }
                  className="form-input"
                />
              </Field>
            ) : (
              <div className="text-[11px] text-gray-500">
                Sub-products will be named{" "}
                <span className="font-medium text-gray-700">MWL — [Country]</span>
                {" "}(consistent with existing entries under{" "}
                <span className="font-medium text-gray-700">
                  {mwlParent?.name.en ?? "Migrant Worker Loan"}
                </span>
                ).
              </div>
            )}
            <Field
              label={`Description${activeLocale === "km" ? "" : ` (${LOCALES.find(l => l.code === activeLocale)?.label})`}`}
              hint={`${descItems.length} point${descItems.length === 1 ? "" : "s"}. Type a point and press Enter to add.`}
            >
              <SortableListInput
                items={descItems}
                onChange={setDescItems}
                placeholder="e.g. Rate from 9% APR"
              />
            </Field>

          </Section>

          {/* Thumbnail — shown in the product list / carousel in the customer app. */}
          <Section
            icon={ImageIcon}
            title="Thumbnail"
            hint="Shown in the product list and carousel in the customer app. Recommended 900 × 1200px."
          >
            {thumbnail ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail}
                  alt="thumbnail preview"
                  className="w-full max-h-56 object-cover rounded-md border border-gray-200"
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Image
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onThumbnailPick}
                      className="text-xs text-brand-600 hover:underline font-medium"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnail("")}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onThumbnailPick}
                className="w-full h-36 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-brand-700 transition"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs font-medium text-center px-2">Click to upload thumbnail</span>
                <span className="text-[10px] text-gray-400">PNG or JPG · 900 × 1200px</span>
              </button>
            )}
            <input
              ref={thumbnailRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onThumbnailChange}
            />
          </Section>

          {/* Detail image/video — shown on the product's own detail page in the customer app. */}
          <Section
            icon={ImageIcon}
            title="Loan Product Detail"
            hint="Shown on the product's own detail page in the customer app. Recommended 1080 × 1080px."
          >
            {detailImage ? (
              <div>
                {detailImageType === "video" ? (
                  <video
                    src={detailImage}
                    controls
                    className="w-full max-h-56 rounded-md border border-gray-200 bg-black object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detailImage}
                    alt="product detail preview"
                    className="w-full max-h-56 object-cover rounded-md border border-gray-200"
                  />
                )}
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    {detailImageType === "video" ? (
                      <Film className="w-3.5 h-3.5" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    {detailImageType === "video" ? "Video" : "Image"}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onDetailImagePick}
                      className="text-xs text-brand-600 hover:underline font-medium"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailImage("")}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onDetailImagePick}
                className="w-full h-36 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-brand-700 transition"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs font-medium">Click to upload image or video</span>
                <span className="text-[10px] text-gray-400">PNG, JPG, GIF or MP4 · 1080 × 1080px</span>
              </button>
            )}
            <input
              ref={detailImageRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={onDetailImageChange}
            />
          </Section>

          {/* MWL-only: free-form destination country list. Admin types a country
              name and presses Enter (or +) to add it; one sub-product is created
              under the existing Migrant Worker Loan parent per added country.
              Placed below Description so Product Name remains the first input. */}
          {!isEdit && kind === "mwl" && (
            <Section
              icon={Globe}
              title="Destination countries"
              hint={`Adds one sub-product to "${mwlParent?.name.en ?? "Migrant Worker Loan"}" per country. Type a country and press Enter to add.`}
            >
              <div className="flex items-center gap-2">
                <input
                  value={countryInput}
                  onChange={e => setCountryInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitCountry();
                    }
                  }}
                  placeholder="e.g. Korea, Japan, Malaysia…"
                  className="form-input flex-1"
                  maxLength={40}
                />
                <button
                  type="button"
                  onClick={commitCountry}
                  disabled={!countryInput.trim()}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md border",
                    countryInput.trim()
                      ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                      : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                  )}
                >
                  + Add
                </button>
              </div>

              {countries.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {countries.map(c => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100"
                    >
                      <span
                        className="px-1 py-0.5 rounded-sm bg-white/70 text-[10px] font-semibold text-brand-700 uppercase tracking-wider"
                        title="Auto-generated short code"
                      >
                        {countryCodeFor(c)}
                      </span>
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => removeCountry(c)}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-brand-100 text-brand-600"
                        aria-label={`Remove ${c}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-gray-400 italic mt-1">
                  No countries added yet.
                </div>
              )}

              {countries.length > 0 && (
                <div className="mt-3 px-3 py-2 rounded-md bg-violet-50/70 border border-violet-100 text-[11px] text-violet-800 leading-relaxed">
                  Will create <b>{countries.length}</b> new sub-product
                  {countries.length === 1 ? "" : "s"} under{" "}
                  <span className="font-medium">
                    {mwlParent?.name.en ?? "Migrant Worker Loan"}
                  </span>
                  {mwlParent?.id && (
                    <>
                      {" "}
                      (<span className="font-mono">{mwlParent.id}</span>)
                    </>
                  )}
                  .
                </div>
              )}
            </Section>
          )}

          {/* Loan at a glance — dynamic label/value rows */}
          <Section
            icon={CircleDollarSign}
            title="Loan At A Glance"
            hint={`${glanceItems.length} row${glanceItems.length === 1 ? "" : "s"}. Add your own title and value. Incomplete rows are skipped on save.`}
          >
            <GlanceListInput items={glanceItems} onChange={setGlanceItems} />
          </Section>

          {/* Key Feature — free-form sentence rows with show/hide toggles. */}
          <Section
            icon={Check}
            title="Key Feature"
            hint={`${kfItems.length} row${kfItems.length === 1 ? "" : "s"}. Type a sentence per row.`}
          >
            <SentenceListInput
              items={kfItems}
              onChange={setKfItems}
              placeholder="e.g. Fast approval within 24 hours"
            />
          </Section>

          {/* Eligibility — same sentence-row pattern. */}
          <Section
            icon={ShieldCheck}
            title="Eligibility"
            hint={`${eligItems.length} row${eligItems.length === 1 ? "" : "s"}. Type a sentence per row.`}
          >
            <SentenceListInput
              items={eligItems}
              onChange={setEligItems}
              placeholder="e.g. Age 18 to 65 years old"
            />
          </Section>

          {/* FAQ */}
          <Section
            icon={HelpCircle}
            title="FAQ"
            hint={`${faqItems.length} question${faqItems.length === 1 ? "" : "s"}. Add a question and its answer.`}
          >
            <FaqListInput items={faqItems} onChange={setFaqItems} />
          </Section>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status — Active/Inactive toggle. Drives the primary save button's
              saved status. "Save as draft" bypasses this and forces draft. */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Status</span>
            <button
              type="button"
              role="switch"
              aria-checked={activeNow}
              onClick={() => setActiveNow(v => !v)}
              title={activeNow ? "Switch to Inactive" : "Switch to Active"}
              className={cn(
                "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
                activeNow ? "bg-brand-600" : "bg-gray-300"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  activeNow ? "translate-x-[18px]" : "translate-x-0.5"
                )}
              />
            </button>
            <span
              className={cn(
                "text-xs font-medium",
                activeNow ? "text-emerald-700" : "text-gray-500"
              )}
            >
              {activeNow ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Cancel
            </button>
            {/* "Save as draft" is a create-flow affordance only. Once a product
                exists the lifecycle is controlled by the Active/Inactive toggle —
                editing a product shouldn't re-park it back into Draft. */}
            {!isEdit && (
              <button
                onClick={() => submit(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
              >
                Save as draft
              </button>
            )}
            <button
              onClick={() => submit(true)}
              className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              {isEdit ? "Update now" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          /* Symmetric Y padding + explicit line-height so the value/placeholder
             text sits in the vertical center of the input frame. Without an
             explicit line-height, inputs inherit from the parent and the text
             can drift toward the top of the frame. */
          padding-top: 0.5rem;
          padding-right: 0.75rem;
          padding-bottom: 0.5rem;
          padding-left: 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background: white;
          outline: none;
        }
        :global(textarea.form-input) {
          /* Textareas get slightly looser line spacing for multi-line copy. */
          line-height: 1.5;
        }
        :global(.form-input:focus) {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
        }
        /* Hide the native up/down spinner controls on number inputs — they
           clash with our left/right affix decorations (e.g. "$", "%", "m"). */
        :global(input.form-input[type="number"]) {
          -moz-appearance: textfield;
          appearance: textfield;
        }
        :global(input.form-input[type="number"]::-webkit-outer-spin-button),
        :global(input.form-input[type="number"]::-webkit-inner-spin-button) {
          -webkit-appearance: none;
          margin: 0;
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

/** Add-a-line list with removable items. Used for Description points. */
function SortableListInput({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput("");
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="form-input flex-1"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md border",
            input.trim()
              ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
              : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
          )}
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50/60 px-2.5 py-2"
            >
              <span className="text-sm text-gray-700 min-w-0">{item}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-600 flex-shrink-0"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

type DocItem = { name: string; note?: string; icon?: string };

type GlanceItem = { label: string; value: string };

/** Default FAQ rows pre-filled when creating a new product. */
const DEFAULT_FAQS: FaqItem[] = [
  { question: "Can I apply before my contract?", answer: "Yes. Conditional approval may apply." },
  { question: "Which countries are supported?", answer: "Korea, Japan, Singapore, and Israel." },
  { question: "How fast is approval?", answer: "Up to 2 business days." },
  { question: "What documents do I need?", answer: "ID and application documents." },
  { question: "Do I need a guarantor?", answer: "If required by the product." },
  { question: "When will I receive the loan?", answer: "After approval and required conditions are met." },
  { question: "Can I borrow before my visa?", answer: "Yes, if eligible." },
  { question: "Can I repay early?", answer: "Yes." },
  { question: "Can I apply again?", answer: "Yes, subject to reassessment." },
];

/** Default Key Feature rows pre-filled when creating a new product. */
const DEFAULT_KEY_FEATURES: string[] = [
  "Fast review — decision within 3 business days",
  "Flexible repayment: monthly or irregular",
  "Collateral required",
  "Co-borrower required",
];

/** Default Eligibility rows pre-filled when creating a new product. */
const DEFAULT_ELIGIBILITY: string[] = [
  "Cambodian national or registered business",
  "Minimum 6 months of trading history",
  "Valid business registration for amounts above USD 5,000",
  "No active default on existing loans",
];

/** Parse a legacy "• line\n• line" string into sentence rows. */
function linesToSentences(text?: string): string[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map(s => s.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
}

/** Sentence list: one sentence per row, inline edit, and confirm-guarded
 *  delete (matching Loan At A Glance). */
function SentenceListInput({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  // Row pending delete confirmation — these rows feed the customer's mobile
  // product page, so a filled row never deletes on a single (mis)click.
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput("");
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const askRemove = (i: number) => {
    // Empty rows carry no data — delete them without ceremony.
    if (!items[i].trim()) return remove(i);
    setConfirmRemove(i);
  };
  const patch = (i: number, text: string) =>
    onChange(items.map((it, idx) => (idx === i ? text : it)));

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="form-input flex-1"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md border flex-shrink-0",
            input.trim()
              ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
              : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
          )}
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50/60 px-2.5 py-2"
            >
              <input
                value={item}
                onChange={e => patch(i, e.target.value)}
                placeholder={placeholder}
                className="flex-1 min-w-0 text-sm text-gray-700 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => askRemove(i)}
                className="text-gray-400 hover:text-red-600 flex-shrink-0"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {confirmRemove !== null && items[confirmRemove] !== undefined && (
        <ConfirmDialog
          title={`Remove "${
            items[confirmRemove].trim().length > 48
              ? items[confirmRemove].trim().slice(0, 48) + "…"
              : items[confirmRemove].trim()
          }"?`}
          message="This row is shown on the customer's mobile product page. Once removed, it disappears from the app when you save."
          confirmLabel="Remove row"
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => {
            remove(confirmRemove);
            setConfirmRemove(null);
          }}
        />
      )}
    </>
  );
}

/** Default "Loan At A Glance" rows pre-filled when creating a new product. */
const DEFAULT_GLANCE_ROWS: GlanceItem[] = [
  { label: "Interest Rate", value: "" },
  { label: "Loan Amount", value: "" },
  { label: "Tenure", value: "" },
  { label: "Purpose", value: "" },
];

/** Example values shown as placeholders for the well-known default rows. */
const GLANCE_VALUE_HINTS: Record<string, string> = {
  "interest rate": "From 0.98% / month",
  "loan amount": "USD 500 – USD 15,000",
  tenure: "36 months",
  purpose: "Overseas job expenses",
};

const glanceHintFor = (label: string) =>
  GLANCE_VALUE_HINTS[label.trim().toLowerCase()] ?? "Value";

/** Derive glance rows from a legacy product's structured numeric fields. */
function glanceRowsFromProduct(p: LoanProduct): GlanceItem[] {
  const usd = (n: number) => `USD ${n.toLocaleString()}`;
  return [
    {
      label: "Interest Rate",
      value: p.rateMax > 0 ? `From ${p.rateMax}% / month` : "",
    },
    {
      label: "Loan Amount",
      value:
        p.min > 0 || p.max > 0
          ? p.min === p.max
            ? usd(p.max)
            : `${usd(p.min)} – ${usd(p.max)}`
          : "",
    },
    {
      label: "Tenure",
      value: p.termMax > 0 ? `${p.termMax} months` : "",
    },
    { label: "Purpose", value: p.purpose ?? "" },
  ];
}

/** Loan At A Glance list: add a title + value row, edit inline, remove, drag-reorder. */
function GlanceListInput({
  items,
  onChange,
}: {
  items: GlanceItem[];
  onChange: (items: GlanceItem[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  // Row pending delete confirmation. These rows feed the customer's mobile
  // product page, so a filled row never deletes on a single (mis)click.
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const canAdd = !!label.trim() && !!value.trim();
  const add = () => {
    if (!canAdd) return;
    onChange([...items, { label: label.trim(), value: value.trim() }]);
    setLabel("");
    setValue("");
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const askRemove = (i: number) => {
    // Empty rows carry no data — delete them without ceremony.
    const it = items[i];
    if (!it.label.trim() && !it.value.trim()) return remove(i);
    setConfirmRemove(i);
  };
  const patch = (i: number, p: Partial<GlanceItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)));

  return (
    <>
      <div className="rounded-md border border-gray-200 bg-gray-50/60 p-2.5 flex flex-col sm:flex-row gap-2">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Title, e.g. Processing Fee"
          className="form-input min-w-0 sm:flex-1"
        />
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Value, e.g. 2% of loan amount"
          className="form-input min-w-0 sm:flex-[2]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!canAdd}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md border flex-shrink-0",
            canAdd
              ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
              : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
          )}
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50/60 px-2.5 py-2"
            >
              <input
                value={item.label}
                onChange={e => patch(i, { label: e.target.value })}
                placeholder="Title"
                className="w-1/3 min-w-0 text-xs font-medium text-gray-700 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-gray-400"
              />
              <input
                value={item.value}
                onChange={e => patch(i, { value: e.target.value })}
                placeholder={glanceHintFor(item.label)}
                className="flex-1 min-w-0 text-sm text-gray-700 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => askRemove(i)}
                className="text-gray-400 hover:text-red-600 flex-shrink-0"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {confirmRemove !== null && items[confirmRemove] && (
        <ConfirmDialog
          title={`Remove "${items[confirmRemove].label.trim() || "this row"}"?`}
          message="This row is shown on the customer's mobile product page. Once removed, it disappears from the app when you save."
          confirmLabel="Remove row"
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => {
            remove(confirmRemove);
            setConfirmRemove(null);
          }}
        />
      )}
    </>
  );
}

/* Small destructive-action confirmation, layered above the product modal
 * (z-50) so it reads as a child of the form. */
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">{title}</div>
              <div className="text-xs text-gray-600 mt-1">{message}</div>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700 font-medium"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type FaqItem = { question: string; answer: string };

/** FAQ list: type a question + answer, add, edit inline, remove, drag-reorder. */
function FaqListInput({
  items,
  onChange,
}: {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  // Row pending delete confirmation — these rows feed the customer's mobile
  // product page, so a filled row never deletes on a single (mis)click.
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const canAdd = !!question.trim() && !!answer.trim();
  const add = () => {
    if (!canAdd) return;
    onChange([...items, { question: question.trim(), answer: answer.trim() }]);
    setQuestion("");
    setAnswer("");
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const askRemove = (i: number) => {
    // Empty rows carry no data — delete them without ceremony.
    const it = items[i];
    if (!it.question.trim() && !it.answer.trim()) return remove(i);
    setConfirmRemove(i);
  };
  const patch = (i: number, p: Partial<FaqItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)));

  return (
    <>
      <div className="rounded-md border border-gray-200 bg-gray-50/60 p-2.5 space-y-2">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Question, e.g. What documents do I need?"
          className="form-input"
        />
        <div className="flex items-center gap-2">
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Answer customers will see"
            className="form-input flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md border flex-shrink-0",
              canAdd
                ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
            )}
          >
            Add
          </button>
        </div>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start justify-between gap-2 rounded-md border border-gray-200 bg-gray-50/60 px-2.5 py-2"
            >
              <span className="flex items-start gap-2 min-w-0 flex-1">
                <span className="min-w-0 flex-1">
                  <input
                    value={item.question}
                    onChange={e => patch(i, { question: e.target.value })}
                    placeholder="Question"
                    className="w-full text-sm text-gray-700 font-medium bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-gray-400"
                  />
                  <input
                    value={item.answer}
                    onChange={e => patch(i, { answer: e.target.value })}
                    placeholder="Answer"
                    className="mt-0.5 w-full text-xs text-gray-500 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-gray-400"
                  />
                </span>
              </span>
              <button
                type="button"
                onClick={() => askRemove(i)}
                className="text-gray-400 hover:text-red-600 flex-shrink-0 mt-0.5"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {confirmRemove !== null && items[confirmRemove] && (
        <ConfirmDialog
          title={`Remove "${
            items[confirmRemove].question.trim().length > 48
              ? items[confirmRemove].question.trim().slice(0, 48) + "…"
              : items[confirmRemove].question.trim() || "this question"
          }"?`}
          message="This question is shown on the customer's mobile product page. Once removed, it disappears from the app when you save."
          confirmLabel="Remove row"
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => {
            remove(confirmRemove);
            setConfirmRemove(null);
          }}
        />
      )}
    </>
  );
}

/* ---------- detail product modal ---------- */

function DetailProductModal({
  product,
  onClose,
  canEdit,
  onUpdateStatus,
  onEdit,
}: {
  product: LoanProduct | null;
  onClose: () => void;
  canEdit: boolean;
  onUpdateStatus: (id: string, next: "active" | "inactive" | "draft") => void;
  onEdit: (p: LoanProduct) => void;
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

  // Prefer the saved dynamic rows; legacy products fall back to rows derived
  // from the structured numeric fields. Rows without a value are hidden.
  const glance = (
    product.atAGlance?.length ? product.atAGlance : glanceRowsFromProduct(product)
  ).filter(g => g.value);
  // Products without saved rows fall back to the same defaults the create
  // form pre-fills, so the detail view always mirrors the form's sections.
  const keyFeatureLines = product.keyFeatures
    ? linesOf(product.keyFeatures)
    : DEFAULT_KEY_FEATURES;
  const eligibilityLines = product.eligibility
    ? linesOf(product.eligibility)
    : DEFAULT_ELIGIBILITY;
  const faqs = product.faqs?.length ? product.faqs : DEFAULT_FAQS;

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
              <div className="text-lg font-semibold text-gray-900">{product.name.en}</div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <StatusBadge
                  status={
                    product.status === "active"
                      ? "Active"
                      : product.status === "inactive"
                      ? "Inactive"
                      : "Draft"
                  }
                />
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
          {/* Thumbnail */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3" />
              Thumbnail (900 × 1200px)
            </div>
            {product.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.thumbnail}
                alt="product thumbnail"
                className="w-full max-h-56 object-cover rounded-md border border-gray-200"
              />
            ) : (
              <div className="h-24 rounded-md border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400">
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs">No thumbnail uploaded yet</span>
              </div>
            )}
          </div>

          {/* Loan Product Detail image/video */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3" />
              Loan Product Detail (1080 × 1080px)
            </div>
            {product.detailImage ? (
              product.detailImageType === "video" ? (
                <video
                  src={product.detailImage}
                  controls
                  className="w-full max-h-56 rounded-md border border-gray-200 bg-black object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.detailImage}
                  alt="product detail"
                  className="w-full max-h-56 object-cover rounded-md border border-gray-200"
                />
              )
            ) : (
              <div className="h-24 rounded-md border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400">
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs">No image or video uploaded yet</span>
              </div>
            )}
          </div>

          {/* Reference product icon */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3" />
              Reference product icon (42 × 42 px)
            </div>
            <div className="flex items-center gap-3">
              {product.icon ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.icon}
                    alt="product icon"
                    className="w-[42px] h-[42px] rounded-lg border border-gray-200 object-cover flex-shrink-0"
                  />
                  <span className="text-xs text-gray-500">
                    Shown beside the product name in the customer app.
                  </span>
                </>
              ) : (
                <>
                  <div className="w-[42px] h-[42px] rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 flex-shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-400">No icon uploaded yet</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {(product.description.km || product.description.en) && (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Description
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {product.description.en || product.description.km}
              </p>
            </div>
          )}

          {/* Loan at a glance — label/value rows, matching the create form. */}
          {glance.length > 0 && (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <CircleDollarSign className="w-3 h-3" />
                Loan at a glance
              </div>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                {glance.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <span className="text-xs text-gray-500 flex-shrink-0">{g.label}</span>
                    <span className="text-sm font-semibold text-gray-900 text-right">
                      {g.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key feature */}
          {keyFeatureLines.length > 0 && (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Key feature
              </div>
              <ul className="space-y-1.5">
                {keyFeatureLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-1 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Eligibility */}
          {eligibilityLines.length > 0 && (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Eligibility
              </div>
              <ul className="space-y-1.5">
                {eligibilityLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-1 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAQ */}
          {faqs.length > 0 && (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3" />
                FAQ
              </div>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                {faqs.map((f, i) => (
                  <div key={i} className="px-3 py-2.5">
                    <div className="text-sm font-medium text-gray-900">{f.question}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{f.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onEdit(product)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                Edit
              </button>
              {product.status === "active" ? (
                <button
                  onClick={() => {
                    onUpdateStatus(product.id, "inactive");
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

