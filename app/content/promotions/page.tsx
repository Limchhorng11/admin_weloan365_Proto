"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { PROMOTIONS, PRODUCTS, type Promotion, type PromotionCta } from "@/lib/data";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import {
  Plus,
  X,
  Search,
  Upload,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Package,
  Phone,
} from "lucide-react";

// Loan products a promotion's "Loan Detail" button can deep-link to. The MWL
// parent isn't directly appliable — customers apply to a specific country
// sub-product — so it's excluded from the picker.
const CTA_LOAN_PRODUCTS = PRODUCTS.filter(p => p.kind !== "mwl-parent");

function ctaLoanProductName(id: string) {
  return CTA_LOAN_PRODUCTS.find(p => p.id === id)?.name ?? id;
}

export default function PromotionsPage() {
  const { can, user } = useRole();
  const canEdit = can("promotion.manage");

  const [list, setList] = useState<Promotion[]>(PROMOTIONS);
  const [query, setQuery] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(p =>
      `${p.title} ${p.description}`.toLowerCase().includes(q)
    );
  }, [list, query]);

  const nextId = useMemo(() => {
    const maxN = list.reduce((m, p) => {
      const n = parseInt(p.id.replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `PM-${String(maxN + 1).padStart(3, "0")}`;
  }, [list]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setEditorOpen(true);
  };

  const handleSave = (p: Promotion) => {
    setList(prev => {
      const exists = prev.find(x => x.id === p.id);
      return exists ? prev.map(x => (x.id === p.id ? p : x)) : [p, ...prev];
    });
    setEditorOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setList(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Promotion"
        subtitle="Manage promotional banners shown to customers in the mobile app."
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All promotions</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === 0
                ? "No promotions in this filter"
                : `${filtered.length} promotion${filtered.length === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search promotions..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-full sm:w-56"
              />
            </div>
            {canEdit && (
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                New promotion
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-medium text-gray-900">No promotions match</div>
            <div className="text-xs text-gray-500 mt-1">Try adjusting your search.</div>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["Promotion", "Author", "Status", "Date", "End date"].map(h => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-[12px] font-medium text-gray-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Thumb url={p.image} />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate max-w-[420px]">
                          {p.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[420px] mt-0.5">
                          {p.description}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400">
                          {p.cta.type === "loan" ? (
                            <>
                              <Package className="w-3 h-3" />
                              {ctaLoanProductName(p.cta.productId)}
                            </>
                          ) : (
                            <>
                              <Phone className="w-3 h-3" />
                              {p.cta.phone}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-700 text-xs">{p.author}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-600 text-xs">{p.date}</td>
                  <td className="px-6 py-3.5 text-xs">
                    {p.deadline ? (
                      <span className="text-gray-700">{p.deadline}</span>
                    ) : (
                      <span className="text-gray-300 italic">No deadline</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {canEdit && (
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs text-brand-600 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-xs text-red-600 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <PromotionEditorModal
        open={editorOpen}
        initial={editing}
        nextId={nextId}
        authorName={user.name}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}

/* ---------- thumbnail ---------- */

function Thumb({ url }: { url: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="w-14 h-14 rounded-md object-cover bg-gray-100 flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-400">
      <ImageIcon className="w-4 h-4" />
    </div>
  );
}

/* ====================================================================
   Promotion editor modal — Title, Description, Image
   ==================================================================== */

function PromotionEditorModal({
  open,
  initial,
  nextId,
  authorName,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Promotion | null;
  nextId: string;
  authorName: string;
  onClose: () => void;
  onSave: (p: Promotion) => void;
}) {
  const isEdit = !!initial;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [deadlineOn, setDeadlineOn] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Choice button — the single action a customer can take from this promo.
  const [ctaType, setCtaType] = useState<"loan" | "call">("loan");
  const [ctaProductId, setCtaProductId] = useState("");
  const [ctaPhone, setCtaPhone] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // Init / reset whenever the modal opens
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description);
      setImage(initial.image);
      setDeadlineOn(!!initial.deadline);
      setDeadline(initial.deadline ?? "");
      setCtaType(initial.cta.type);
      setCtaProductId(initial.cta.type === "loan" ? initial.cta.productId : "");
      setCtaPhone(initial.cta.type === "call" ? initial.cta.phone : "");
    } else {
      setTitle("");
      setDescription("");
      setImage("");
      setDeadlineOn(false);
      setDeadline("");
      setCtaType("loan");
      setCtaProductId("");
      setCtaPhone("");
    }
    setError(null);
  }, [open, initial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onPickFile = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please pick an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
    setError(null);
  };

  const submit = () => {
    if (!title.trim()) return setError("Title is required.");
    if (!description.trim()) return setError("Description is required.");
    if (deadlineOn && !deadline) return setError("Pick a deadline date or turn the deadline off.");
    if (ctaType === "loan" && !ctaProductId) return setError("Choose which loan product the button opens.");
    if (ctaType === "call" && !ctaPhone.trim()) return setError("Enter the phone number the button calls.");
    const cta: PromotionCta =
      ctaType === "loan" ? { type: "loan", productId: ctaProductId } : { type: "call", phone: ctaPhone.trim() };
    const promo: Promotion = {
      id: initial?.id ?? nextId,
      title: title.trim(),
      description: description.trim(),
      image,
      // Status is no longer set in the form — preserve the existing value on
      // edit, default to "Active" for new promotions.
      status: initial?.status ?? "Active",
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
      deadline: deadlineOn ? deadline : undefined,
      // Preserve the original author on edit; set the current user on create
      // (mirrors the blog-post editor behavior).
      author: initial?.author ?? authorName,
      cta,
    };
    onSave(promo);
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit promotion" : "New promotion"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Shown to customers in the mobile app.{" "}
              <span className="font-mono text-gray-600">{initial?.id ?? nextId}</span>
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

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Khmer New Year — 0% Processing Fee"
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short summary of the offer shown under the title."
              rows={3}
              maxLength={200}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <div className="text-[11px] text-gray-400 mt-1">{description.length} / 200</div>
          </div>

          {/* Choice button — the single action customers can take from this
              promotion in the mobile app: open a loan product's detail page,
              or call a number. */}
          <div>
            <label className="text-xs font-medium text-gray-700">Choice button *</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCtaType("loan")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border",
                  ctaType === "loan"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                <Package className="w-3.5 h-3.5" />
                Loan Detail
              </button>
              <button
                type="button"
                onClick={() => setCtaType("call")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border",
                  ctaType === "call"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                <Phone className="w-3.5 h-3.5" />
                Call
              </button>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              What tapping this promotion does in the customer app.
            </div>

            {ctaType === "loan" ? (
              <select
                value={ctaProductId}
                onChange={e => setCtaProductId(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">Select a loan product…</option>
                {CTA_LOAN_PRODUCTS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={ctaPhone}
                onChange={e => setCtaPhone(e.target.value)}
                placeholder="e.g. +855 23 999 000"
                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Image</label>
            <div className="mt-1.5">
              {image ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt="promotion preview"
                    className="w-full h-40 object-cover rounded-md border border-gray-200"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={onPickFile}
                      className="text-xs text-brand-600 hover:underline font-medium"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onPickFile}
                  className="w-full h-40 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-brand-700 transition"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-medium">Click to upload</span>
                  <span className="text-[10px] text-gray-400">PNG, JPG up to ~2 MB</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          </div>

          {/* Author — read-only; stamped from the current user on create,
              preserved on edit. Mirrors the blog-post editor's Author field. */}
          <div>
            <label className="text-xs font-medium text-gray-700">Author</label>
            <input
              value={initial?.author ?? authorName}
              readOnly
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-600"
            />
          </div>

          {/* Deadline — optional. Toggle to enable a date picker. Mirrors the
              on/off switch + disabled-input pattern from the create-product form. */}
          <div className="border border-gray-200 rounded-md">
            <div
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2",
                !deadlineOn && "bg-gray-50/60"
              )}
            >
              <label
                className={cn(
                  "text-xs font-medium",
                  deadlineOn ? "text-gray-700" : "text-gray-400"
                )}
              >
                Set deadline
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={deadlineOn}
                onClick={() => setDeadlineOn(v => !v)}
                title={deadlineOn ? "Disable deadline" : "Enable deadline"}
                className={cn(
                  "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
                  deadlineOn ? "bg-brand-600" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    deadlineOn ? "translate-x-[18px]" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
            <div
              className={cn(
                "px-3 pb-3 pt-1 transition-opacity",
                !deadlineOn && "opacity-50 pointer-events-none select-none"
              )}
              aria-disabled={!deadlineOn}
            >
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <div className="text-[11px] text-gray-400 mt-1">
                Optional — the promotion will be hidden from customers after this date.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
          >
            {isEdit ? "Save changes" : "Create promotion"}
          </button>
        </div>
      </div>
    </div>
  );
}
