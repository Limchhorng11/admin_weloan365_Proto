"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { PROMOTIONS, type Promotion, type PromotionStatus } from "@/lib/data";
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
} from "lucide-react";

export default function PromotionsPage() {
  const { can } = useRole();
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All promotions</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === 0
                ? "No promotions in this filter"
                : `${filtered.length} promotion${filtered.length === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search promotions..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-56"
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Promotion", "Status", "Date"].map(h => (
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-600 text-xs">{p.date}</td>
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
        )}
      </div>

      <PromotionEditorModal
        open={editorOpen}
        initial={editing}
        nextId={nextId}
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
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Promotion | null;
  nextId: string;
  onClose: () => void;
  onSave: (p: Promotion) => void;
}) {
  const isEdit = !!initial;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<PromotionStatus>("Active");
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Init / reset whenever the modal opens
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description);
      setImage(initial.image);
      setStatus(initial.status);
    } else {
      setTitle("");
      setDescription("");
      setImage("");
      setStatus("Active");
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
    const promo: Promotion = {
      id: initial?.id ?? nextId,
      title: title.trim(),
      description: description.trim(),
      image,
      status,
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
    };
    onSave(promo);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
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
        <div className="p-6 space-y-4">
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

          <div>
            <label className="text-xs font-medium text-gray-700">Status</label>
            <div className="mt-1 flex gap-2">
              {(["Active", "Inactive"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-md border transition",
                    status === s
                      ? s === "Active"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30"
                        : "border-gray-400 bg-gray-50 text-gray-700 ring-1 ring-gray-400/30"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-end gap-2">
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
