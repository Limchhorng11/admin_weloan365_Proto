"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  POSTS,
  POST_CATEGORIES,
  LOCALES,
  emptyLocalizedText,
  type Post,
  type PostCategory,
  type PostCategoryGroup,
  type PostCategoryId,
  type PostMedia,
  type PostStatus,
  type Locale,
  type LocalizedText,
} from "@/lib/data";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import {
  Plus,
  X,
  Search,
  Bold,
  Italic,
  Heading2,
  List,
  Link2,
  Quote,
  Image as ImageIcon,
  Upload,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Film,
  Play,
  MapPin,
  AlertTriangle,
  Camera,
} from "lucide-react";

const PAGE_SIZE = 8;

const CATEGORY_TONE: Record<string, string> = {
  blue:    "bg-sky-50 text-sky-700",
  violet:  "bg-violet-50 text-violet-700",
  amber:   "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose:    "bg-rose-50 text-rose-700",
};

// Solid-color version of the same tones, for the badge overlaid on the
// header image/video in the customer-app preview (e.g. "FINANCIAL BASICS"
// on a photo) — needs to read against a photo, so a light chip won't do.
const CATEGORY_OVERLAY_TONE: Record<string, string> = {
  blue:    "bg-sky-600 text-white",
  violet:  "bg-violet-600 text-white",
  amber:   "bg-amber-600 text-white",
  emerald: "bg-emerald-600 text-white",
  rose:    "bg-rose-600 text-white",
};

// Cycled through when a new category is created, so custom categories still
// get a distinct, readable color instead of all defaulting to one tone.
const CATEGORY_TONE_KEYS = Object.keys(CATEGORY_TONE);

// Default CSR quotation — the standing commitment line shown in the customer
// app's CSR section. Pre-filled on new CSR posts; the admin can edit it.
const CSR_DEFAULT_QUOTATION =
  "Beyond financing, NH Finance invests in the communities we serve — supporting education, welfare and disaster relief across Cambodia.";

/** Turns a category name into a stable, unique id (e.g. "Community Events" →
 *  "community-events"), disambiguating with a numeric suffix on collision. */
function slugifyCategoryId(label: string, existing: PostCategory[]) {
  const base = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "") || "category";
  let id = base;
  let n = 2;
  while (existing.some(c => c.id === id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

/** Formats an ISO date as "1 Jul 2026", matching the customer app's byline. */
function formatPostDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function categoryMeta(categories: PostCategory[], id: PostCategoryId) {
  return categories.find(c => c.id === id) ?? categories[0];
}

/** How much of a language's content is filled in, for the little status dots
 *  on the language tabs and the posts table. */
type LocaleFill = "empty" | "partial" | "complete";
function localeFillStatus(title: string, excerpt: string, body: string): LocaleFill {
  const filled = [title, excerpt, body].filter(s => s.trim().length > 0).length;
  if (filled === 0) return "empty";
  if (filled === 3) return "complete";
  return "partial";
}

/** Small flag row showing which of the 3 languages have content — greyed out
 *  when a translation is still missing. Reused in the table and the editor's
 *  language tabs. */
function LangDots({
  post,
  size = "text-xs",
}: {
  post: { title: LocalizedText; excerpt: LocalizedText; body: LocalizedText };
  size?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {LOCALES.map(l => {
        const status = localeFillStatus(post.title[l.code], post.excerpt[l.code], post.body[l.code]);
        return (
          <span
            key={l.code}
            title={`${l.label}: ${status === "complete" ? "translated" : status === "partial" ? "in progress" : "not translated"}`}
            className={cn(size, status === "empty" ? "grayscale opacity-30" : status === "partial" ? "opacity-60" : "")}
          >
            {l.flag}
          </span>
        );
      })}
    </span>
  );
}

function CategoryBadge({ id, categories }: { id: PostCategoryId; categories: PostCategory[] }) {
  const c = categoryMeta(categories, id);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
        CATEGORY_TONE[c.tone]
      )}
    >
      {c.label}
    </span>
  );
}

/** Shared list/editor UI for both /content/posts (the "media" category group)
 *  and /content/csr (the "csr" group — its own route/nav entry). Each page
 *  only lists posts in — and manages categories of — its own group. */
export function PostsManager({
  group = "media",
  pageTitle = "Blog Posts",
  pageDescription = "Publish blog articles, news, announcements and more to the customer mobile app.",
}: {
  group?: PostCategoryGroup;
  pageTitle?: string;
  pageDescription?: string;
} = {}) {
  const { can, user } = useRole();
  const canEdit = can("post.manage");

  const [list, setList]       = useState<Post[]>(POSTS);
  const [categories, setCategories] = useState<PostCategory[]>(POST_CATEGORIES);
  const [query, setQuery]     = useState("");
  const [category, setCategory] = useState<"all" | PostCategoryId>("all");
  const [page, setPage]       = useState(1);

  // Only this page's categories are shown/managed here.
  const groupCategories = categories.filter(c => c.group === group);

  /** Adds a custom category to this page's group and returns its generated id
   *  so the editor can select it immediately. */
  const addCategory = (label: string): PostCategoryId | null => {
    const trimmed = label.trim();
    if (!trimmed) return null;
    const id = slugifyCategoryId(trimmed, categories);
    const tone = CATEGORY_TONE_KEYS[groupCategories.length % CATEGORY_TONE_KEYS.length];
    setCategories(prev => [...prev, { id, label: trimmed, tone, group }]);
    return id;
  };

  /** Removes a category and reassigns any posts using it to another category
   *  in the same group, so the table never shows a dangling badge. The last
   *  category of a group can't be deleted — its page needs at least one. */
  const deleteCategory = (id: PostCategoryId) => {
    const fallback = categories.find(c => c.group === group && c.id !== id);
    if (!fallback) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    setList(prev => prev.map(p => (p.category === id ? { ...p, category: fallback.id } : p)));
    setCategory(prev => (prev === id ? "all" : prev));
  };

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing]       = useState<Post | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groupIds = new Set(categories.filter(c => c.group === group).map(c => c.id));
    return list.filter(p => {
      // Each page only lists its own group's posts (Blog Posts vs. CSR).
      if (!groupIds.has(p.category)) return false;
      if (category !== "all" && p.category !== category) return false;
      // Search across every language's title/excerpt, not just English.
      const haystack = `${Object.values(p.title).join(" ")} ${Object.values(p.excerpt).join(" ")} ${p.author}`;
      if (q && !haystack.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, query, category, categories, group]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => setPage(1), [query, category]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const nextId = useMemo(() => {
    const maxN = list.reduce((m, p) => {
      const n = parseInt(p.id.replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `P-${String(maxN + 1).padStart(3, "0")}`;
  }, [list]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (p: Post) => {
    setEditing(p);
    setEditorOpen(true);
  };

  const handleSave = (p: Post) => {
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
      <PageHeader title={pageTitle} subtitle={pageDescription} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All posts</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length === 0
                ? "No posts in this filter"
                : `Showing ${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-full sm:w-56"
              />
            </div>
            {canEdit && (
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                New post
              </button>
            )}
          </div>
        </div>

        {/* Category filter chips — this page's group only. */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-gray-200 flex-wrap">
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full border",
              category === "all"
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            All ({list.filter(p => groupCategories.some(c => c.id === p.category)).length})
          </button>
          {groupCategories.map(c => {
            const active = category === c.id;
            const count = list.filter(p => p.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full border inline-flex items-center gap-1.5",
                  active
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                {c.label}
                <span
                  className={cn(
                    "text-[10px] rounded-full px-1.5",
                    active ? "bg-white/20" : "bg-gray-100 text-gray-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-medium text-gray-900">No posts match</div>
            <div className="text-xs text-gray-500 mt-1">
              Try adjusting search or category.
            </div>
            {(query || category !== "all") && (
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["Post", "Category", "Author", "Status", "Views", "Date"].map(h => (
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
              {paginated.map(p => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Thumb media={p.media} category={p.category} categories={categories} />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate max-w-[320px]">
                          {p.title.en}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[320px] mt-0.5">
                          {p.excerpt.en}
                        </div>
                        <div className="mt-1">
                          <LangDots post={p} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <CategoryBadge id={p.category} categories={categories} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-700 text-xs">{p.author}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">
                    {p.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-gray-600 text-xs">{p.date}</td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      {canEdit && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Pagination */}
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

      <PostEditorModal
        open={editorOpen}
        initial={editing}
        nextId={nextId}
        authorName={user.name}
        group={group}
        categories={groupCategories}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
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

function Thumb({
  media,
  category,
  categories,
}: {
  media: PostMedia[];
  category: PostCategoryId;
  categories: PostCategory[];
}) {
  const c = categoryMeta(categories, category);
  const first = media[0];
  if (first && first.type === "video") {
    return (
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-900 flex-shrink-0">
        <video src={first.url} className="w-full h-full object-cover opacity-70" muted />
        <Play className="w-4 h-4 text-white absolute inset-0 m-auto" fill="white" />
      </div>
    );
  }
  if (first) {
    return (
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={first.url} alt="" className="w-full h-full object-cover" />
        {media.length > 1 && (
          <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/60 text-white text-[9px] font-medium">
            +{media.length - 1}
          </span>
        )}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0",
        CATEGORY_TONE[c.tone]
      )}
    >
      <ImageIcon className="w-4 h-4 opacity-60" />
    </div>
  );
}

/* ====================================================================
   Post editor modal (CMS-style)
   ==================================================================== */

function PostEditorModal({
  open,
  initial,
  nextId,
  authorName,
  group,
  categories,
  onAddCategory,
  onDeleteCategory,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Post | null;
  nextId: string;
  authorName: string;
  /** Which page this editor belongs to — CSR gets extra fields (quotation). */
  group: PostCategoryGroup;
  /** The current page's category group (Blog Posts vs. CSR sub-categories). */
  categories: PostCategory[];
  onAddCategory: (label: string) => PostCategoryId | null;
  onDeleteCategory: (id: PostCategoryId) => void;
  onClose: () => void;
  onSave: (p: Post) => void;
}) {
  const isEdit = !!initial;
  const defaultCategory = categories[0]?.id ?? "blog";
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<PostCategory | null>(null);

  // Each text field is a per-language record — English is required, Khmer
  // and Korean are optional translations filled in whenever ready.
  const [title, setTitleMap]     = useState<LocalizedText>(emptyLocalizedText());
  const [excerpt, setExcerptMap] = useState<LocalizedText>(emptyLocalizedText());
  const [body, setBodyMap]       = useState<LocalizedText>(emptyLocalizedText());
  const [category, setCategory]   = useState<PostCategoryId>("blog");
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [location, setLocation]   = useState("");
  const [quotation, setQuotation] = useState("");
  // Optional follow-up block shown below the article body (e.g. "A continued
  // commitment" note on a CSR activity post).
  const [secondaryTitle, setSecondaryTitleMap] = useState<LocalizedText>(emptyLocalizedText());
  const [secondaryBody, setSecondaryBodyMap]   = useState<LocalizedText>(emptyLocalizedText());
  const [status, setStatus]       = useState<PostStatus>("Draft");
  const [error, setError]         = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>("en");

  // The form always edits whichever language tab is active.
  const titleVal   = title[activeLocale];
  const excerptVal = excerpt[activeLocale];
  const bodyVal    = body[activeLocale];
  const secondaryTitleVal = secondaryTitle[activeLocale];
  const secondaryBodyVal  = secondaryBody[activeLocale];
  const setTitleVal   = (v: string) => setTitleMap(prev => ({ ...prev, [activeLocale]: v }));
  const setExcerptVal = (v: string) => setExcerptMap(prev => ({ ...prev, [activeLocale]: v }));
  const setBodyVal    = (v: string) => setBodyMap(prev => ({ ...prev, [activeLocale]: v }));
  const setSecondaryTitleVal = (v: string) => setSecondaryTitleMap(prev => ({ ...prev, [activeLocale]: v }));
  const setSecondaryBodyVal  = (v: string) => setSecondaryBodyMap(prev => ({ ...prev, [activeLocale]: v }));

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Init / reset whenever the modal opens
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitleMap(initial.title);
      setCategory(initial.category);
      setExcerptMap(initial.excerpt);
      setBodyMap(initial.body);
      setMedia(initial.media);
      setLocation(initial.location ?? "");
      setQuotation(initial.quotation ?? "");
      setSecondaryTitleMap(initial.secondaryTitle ?? emptyLocalizedText());
      setSecondaryBodyMap(initial.secondaryBody ?? emptyLocalizedText());
      setStatus(initial.status);
    } else {
      setTitleMap(emptyLocalizedText());
      setCategory(defaultCategory);
      setExcerptMap(emptyLocalizedText());
      setBodyMap(emptyLocalizedText());
      setMedia([]);
      setLocation("");
      setQuotation(group === "csr" ? CSR_DEFAULT_QUOTATION : "");
      setSecondaryTitleMap(emptyLocalizedText());
      setSecondaryBodyMap(emptyLocalizedText());
      setStatus("Draft");
    }
    setError(null);
    setShowPreview(false);
    setActiveLocale("en");
    // defaultCategory is intentionally NOT a dep — it only matters at open
    // time; re-running on category deletion would wipe an in-progress form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  /* ---- Formatting toolbar (operates on the active language's body) ---- */
  const wrap = (before: string, after: string = before) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = bodyVal.slice(start, end) || "text";
    const next =
      bodyVal.slice(0, start) + before + selected + after + bodyVal.slice(end);
    setBodyVal(next);
    // Restore selection inside the wrappers
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const prependLine = (prefix: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    // Find start of current line
    const lineStart = bodyVal.lastIndexOf("\n", start - 1) + 1;
    const next = bodyVal.slice(0, lineStart) + prefix + bodyVal.slice(lineStart);
    setBodyVal(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const insertLink = () => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = bodyVal.slice(start, end) || "link text";
    const snippet = `[${selected}](https://)`;
    setBodyVal(bodyVal.slice(0, start) + snippet + bodyVal.slice(end));
  };

  /* ---- Cover media upload (multiple images and/or videos) ---- */
  const onPickFile = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (files.some(f => !f.type.startsWith("image/") && !f.type.startsWith("video/"))) {
      setError("Please pick image or video files only.");
      return;
    }
    files.forEach(file => {
      const type: PostMedia["type"] = file.type.startsWith("video/") ? "video" : "image";
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || "");
        if (url) setMedia(prev => [...prev, { url, type }]);
      };
      reader.readAsDataURL(file);
    });
    setError(null);
    // Allow re-picking the same file(s) later.
    e.target.value = "";
  };
  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  /* ---- Category management (add/delete custom categories) ---- */
  const confirmAddCategory = () => {
    const newId = onAddCategory(newCategoryLabel);
    if (newId) setCategory(newId);
    setNewCategoryLabel("");
    setAddingCategory(false);
  };
  const cancelAddCategory = () => {
    setNewCategoryLabel("");
    setAddingCategory(false);
  };
  const confirmDeleteCategoryNow = () => {
    if (!confirmDeleteCategory) return;
    onDeleteCategory(confirmDeleteCategory.id);
    if (category === confirmDeleteCategory.id) {
      const fallback = categories.find(c => c.id !== confirmDeleteCategory.id);
      if (fallback) setCategory(fallback.id);
    }
    setConfirmDeleteCategory(null);
  };

  // Byline date for the Preview pane — the post's actual date once published,
  // otherwise today's (i.e. what it will show once it goes live).
  const previewDate =
    initial?.date && initial.date !== "—" ? initial.date : new Date().toISOString().slice(0, 10);

  /* ---- Submit ---- */
  // English is the canonical/required language; Khmer and Korean are
  // optional translations that can be filled in later.
  const validate = (): string | null => {
    if (!title.en.trim()) return "English title is required.";
    if (!body.en.trim()) return "English article body can't be empty.";
    return null;
  };

  const trimAll = (m: LocalizedText): LocalizedText => ({
    en: m.en.trim(),
    km: m.km.trim(),
    ko: m.ko.trim(),
  });

  const submit = (s: PostStatus) => {
    const err = validate();
    if (err) return setError(err);
    const hasSecondary = secondaryTitle.en.trim() || secondaryBody.en.trim();
    const post: Post = {
      id: initial?.id ?? nextId,
      title: trimAll(title),
      category,
      excerpt: trimAll(excerpt),
      body: trimAll(body),
      media,
      location: location.trim() || undefined,
      quotation: quotation.trim() || undefined,
      secondaryTitle: hasSecondary ? trimAll(secondaryTitle) : undefined,
      secondaryBody: hasSecondary ? trimAll(secondaryBody) : undefined,
      author: initial?.author ?? authorName,
      status: s,
      date:
        s === "Published"
          ? new Date().toISOString().slice(0, 10)
          : initial?.date && s === initial.status
          ? initial.date
          : "—",
      views: initial?.views ?? 0,
    };
    onSave(post);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit post" : "New post"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Posts publish to the customer mobile app.{" "}
              <span className="font-mono text-gray-600">
                {initial?.id ?? nextId}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(p => !p)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border",
                showPreview
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              {showPreview ? "Editing" : "Preview"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {error && (
            <div className="mb-4 px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CSR-only: a short pull-quote highlighted in the article. Sits
              above the language tabs — it's not translated per-language. */}
          {group === "csr" && !showPreview && (
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-700">CSR quotation</label>
              <input
                value={quotation}
                onChange={e => setQuotation(e.target.value)}
                placeholder={'e.g. "Giving back to the communities we serve is at the heart of who we are."'}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm italic focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <div className="text-[11px] text-gray-400 mt-1">
                Optional — shown as a highlighted quote inside the article.
              </div>
            </div>
          )}

          {/* Language tabs — English is required; Khmer/Korean are optional
              translations, filled in whenever ready. Governs both the editor
              fields below and the Preview pane. */}
          <div className="flex items-center gap-1.5 mb-5">
            {LOCALES.map(l => {
              const fill = localeFillStatus(title[l.code], excerpt[l.code], body[l.code]);
              const active = activeLocale === l.code;
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
                  {l.code === "en" && <span className="text-red-500">*</span>}
                  <span
                    title={fill === "complete" ? "Translated" : fill === "partial" ? "In progress" : "Not translated"}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      fill === "complete" ? "bg-emerald-500" : fill === "partial" ? "bg-amber-400" : "bg-gray-300"
                    )}
                  />
                </button>
              );
            })}
          </div>

          {showPreview ? (
            <PostPreview
              title={titleVal}
              category={category}
              categories={categories}
              excerpt={excerptVal}
              body={bodyVal}
              media={media}
              location={location}
              quotation={quotation}
              secondaryTitle={secondaryTitleVal}
              secondaryBody={secondaryBodyVal}
              author={initial?.author ?? authorName}
              date={previewDate}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main editor area */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Title{activeLocale === "en" && " *"}
                  </label>
                  <input
                    value={titleVal}
                    onChange={e => setTitleVal(e.target.value)}
                    placeholder={
                      activeLocale === "en"
                        ? "e.g. 5 tips before taking your first loan"
                        : `Translate the title into ${LOCALES.find(l => l.code === activeLocale)?.label}`
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Cover images or video</label>
                  <div className="mt-1.5">
                    {media.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-1.5">
                          {media.map((m, i) => (
                            <div
                              key={i}
                              className="relative h-24 rounded-md overflow-hidden border border-gray-200 bg-gray-900 group"
                            >
                              {m.type === "video" ? (
                                <>
                                  <video src={m.url} className="w-full h-full object-cover opacity-80" muted />
                                  <Play className="w-6 h-6 text-white absolute inset-0 m-auto" fill="white" />
                                </>
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.url} alt="" className="w-full h-full object-cover" />
                              )}
                              <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                                {m.type === "video" ? <Film className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                                {i + 1}/{media.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeMedia(i)}
                                title="Remove"
                                aria-label={`Remove media ${i + 1}`}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white hover:bg-red-600 flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={onPickFile}
                            className="h-24 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-brand-700 transition"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-[10px] font-medium">Add more</span>
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          The customer app shows multiple items as a swipeable gallery.
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={onPickFile}
                        className="w-full h-40 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-brand-700 transition"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-medium">Click to upload</span>
                        <span className="text-[10px] text-gray-400">
                          One or more images / videos, up to ~2 MB each
                        </span>
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </div>
                </div>

                {/* Body with formatting toolbar */}
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Article body{activeLocale === "en" && " *"}
                  </label>
                  <div className="mt-1 border border-gray-200 rounded-md overflow-hidden focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                      <ToolBtn icon={Heading2} label="Heading" onClick={() => prependLine("## ")} />
                      <ToolBtn icon={Bold}     label="Bold"    onClick={() => wrap("**")} />
                      <ToolBtn icon={Italic}   label="Italic"  onClick={() => wrap("*")} />
                      <div className="w-px h-5 bg-gray-200 mx-1" />
                      <ToolBtn icon={List}     label="List"    onClick={() => prependLine("- ")} />
                      <ToolBtn icon={Quote}    label="Quote"   onClick={() => prependLine("> ")} />
                      <ToolBtn icon={Link2}    label="Link"    onClick={insertLink} />
                    </div>
                    <textarea
                      ref={bodyRef}
                      value={bodyVal}
                      onChange={e => setBodyVal(e.target.value)}
                      placeholder={"Write your article using markdown.\n\n## A heading\n**Bold text**, *italic*, and:\n- a bullet item\n- another item"}
                      rows={16}
                      className="w-full px-3 py-2 text-sm resize-y focus:outline-none font-mono"
                    />
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Markdown supported. Use the toolbar or type{" "}
                    <code className="px-1 bg-gray-100 rounded">**bold**</code>,{" "}
                    <code className="px-1 bg-gray-100 rounded">## heading</code>,{" "}
                    <code className="px-1 bg-gray-100 rounded">- list</code> directly.
                  </div>
                </div>

                {/* Optional follow-up block, shown below the article body
                    (e.g. "A continued commitment" on a CSR activity post) —
                    grouped as one bordered card so it reads as a single,
                    distinct add-on rather than more article-body fields. */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-900">
                    Additional section <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    A short follow-up block shown below the article body — e.g. "A continued commitment" on a CSR post.
                  </p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Section title</label>
                      <input
                        value={secondaryTitleVal}
                        onChange={e => setSecondaryTitleVal(e.target.value)}
                        placeholder="e.g. A continued commitment"
                        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Section description</label>
                      <textarea
                        value={secondaryBodyVal}
                        onChange={e => setSecondaryBodyVal(e.target.value)}
                        placeholder="A short follow-up note shown below the article body."
                        rows={4}
                        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Category *</label>
                    {!addingCategory && (
                      <button
                        type="button"
                        onClick={() => setAddingCategory(true)}
                        className="text-[11px] text-brand-600 hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {categories.map(c => (
                      <div key={c.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => setCategory(c.id)}
                          className={cn(
                            "w-full px-2 py-1.5 text-xs rounded-md border text-left truncate",
                            category === c.id
                              ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          {c.label}
                        </button>
                        {/* The last remaining category can't be deleted —
                            the page needs at least one. */}
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCategory(c)}
                            title={`Delete "${c.label}"`}
                            aria-label={`Delete "${c.label}"`}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-gray-300 text-gray-400 hover:text-red-600 hover:border-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {addingCategory && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={newCategoryLabel}
                        onChange={e => setNewCategoryLabel(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") { e.preventDefault(); confirmAddCategory(); }
                          if (e.key === "Escape") cancelAddCategory();
                        }}
                        placeholder="New category name"
                        className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={confirmAddCategory}
                        className="px-2 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={cancelAddCategory}
                        className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Location</label>
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Siem Reap"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <div className="text-[11px] text-gray-400 mt-1">
                    Optional — shown under the title, e.g. for CSR activities.
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Author</label>
                  <input
                    value={initial?.author ?? authorName}
                    readOnly
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => submit("Draft")}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Save as draft
            </button>
            <button
              onClick={() => submit("Published")}
              className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              {isEdit && initial?.status === "Published" ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {confirmDeleteCategory && (
        <ConfirmDialog
          title={`Delete "${confirmDeleteCategory.label}"?`}
          message={`Posts using this category will be moved to "${
            categories.find(c => c.id !== confirmDeleteCategory.id)?.label ?? "another category"
          }". This can't be undone.`}
          confirmLabel="Delete category"
          onCancel={() => setConfirmDeleteCategory(null)}
          onConfirm={confirmDeleteCategoryNow}
        />
      )}
    </div>
  );
}

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
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
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

function ToolBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="p-1.5 rounded hover:bg-white text-gray-600 hover:text-gray-900"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

/* ---------- preview ---------- */

function PostPreview({
  title,
  category,
  categories,
  excerpt,
  body,
  media,
  location,
  quotation,
  secondaryTitle,
  secondaryBody,
  author,
  date,
}: {
  title: string;
  category: PostCategoryId;
  categories: PostCategory[];
  excerpt: string;
  body: string;
  media: PostMedia[];
  location: string;
  quotation: string;
  secondaryTitle: string;
  secondaryBody: string;
  author: string;
  date: string;
}) {
  const c = categoryMeta(categories, category);
  // Carousel position — clamped so removing items never points past the end.
  const [slide, setSlide] = useState(0);
  const idx = Math.min(slide, Math.max(0, media.length - 1));
  const current = media[idx];
  return (
    <div className="max-w-2xl mx-auto">
      {current ? (
        <div className="relative w-full h-56 rounded-lg overflow-hidden border border-gray-200 bg-gray-900">
          {current.type === "video" ? (
            <>
              <video src={current.url} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" fill="white" />
                </div>
              </div>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt="" className="w-full h-full object-cover" />
          )}
          {media.length > 1 && (
            <>
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[11px] font-medium">
                <Camera className="w-3 h-3" />
                {idx + 1}/{media.length}
              </span>
              <button
                type="button"
                onClick={() => setSlide((idx - 1 + media.length) % media.length)}
                aria-label="Previous media"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSlide((idx + 1) % media.length)}
                aria-label="Next media"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1">
                {media.map((_, i) => (
                  <span
                    key={i}
                    className={cn("w-1.5 h-1.5 rounded-full", i === idx ? "bg-white" : "bg-white/40")}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Category chip sits above the title (matches the customer app). */}
      <div className={cn(current && "mt-4")}>
        <span
          className={cn(
            "inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide",
            CATEGORY_OVERLAY_TONE[c.tone]
          )}
        >
          {c.label}
        </span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mt-2">
        {title || <span className="text-gray-400 italic">Untitled</span>}
      </h1>
      <p className="text-sm text-gray-600 mt-2">
        {excerpt || <span className="text-gray-400 italic">Add a one-line excerpt</span>}
      </p>
      {location.trim() && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
          <MapPin className="w-3 h-3" />
          {location.trim()}
        </div>
      )}
      <div className="text-xs text-gray-400 mt-2">
        By {author} · {formatPostDate(date)}
      </div>

      <div className="prose-sm mt-6">
        {body ? (
          <RenderMarkdown text={body} />
        ) : (
          <p className="text-gray-400 italic">Article body preview…</p>
        )}
      </div>

      {quotation.trim() && (
        <blockquote className="mt-6 border-l-4 border-gray-900 pl-4 py-1 text-sm font-semibold italic text-gray-900">
          "{quotation.trim()}"
        </blockquote>
      )}

      {(secondaryTitle.trim() || secondaryBody.trim()) && (
        <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
          {secondaryTitle.trim() && (
            <div className="text-sm font-semibold text-gray-900">{secondaryTitle}</div>
          )}
          {secondaryBody.trim() && (
            <p className="text-sm text-gray-700 leading-relaxed mt-1">{secondaryBody}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Minimal markdown renderer for live preview. Handles ## headings, **bold**,
 *  *italic*, [link](url), > quote, and "- " bullet lists. */
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  const flushList = (keyBase: number) => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`list-${keyBase}`} className="list-disc pl-5 my-2 space-y-1 text-sm text-gray-700">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      return;
    }
    flushList(i);

    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={i} className="text-lg font-semibold text-gray-900 mt-5 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={i}
          className="border-l-4 border-gray-200 pl-3 italic text-gray-600 my-2 text-sm"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.trim() === "") {
      blocks.push(<div key={i} className="h-2" />);
    } else {
      blocks.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed my-1.5">
          {renderInline(line)}
        </p>
      );
    }
  });
  flushList(lines.length);

  return <div>{blocks}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Tokenise **bold**, *italic*, [link](url)
  const tokens: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        tokens.push(<strong key={key++} className="font-semibold">{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }
    if (text[i] === "*") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1) {
        tokens.push(<em key={key++}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }
    if (text[i] === "[") {
      const close = text.indexOf("]", i + 1);
      if (close > i && text[close + 1] === "(") {
        const urlEnd = text.indexOf(")", close + 2);
        if (urlEnd > close + 2) {
          const label = text.slice(i + 1, close);
          const url = text.slice(close + 2, urlEnd);
          tokens.push(
            <a key={key++} href={url} className="text-brand-600 hover:underline">
              {label}
            </a>
          );
          i = urlEnd + 1;
          continue;
        }
      }
    }
    // plain character — accumulate
    let j = i;
    while (
      j < text.length &&
      !text.startsWith("**", j) &&
      text[j] !== "*" &&
      text[j] !== "["
    ) {
      j++;
    }
    tokens.push(<span key={key++}>{text.slice(i, j)}</span>);
    i = j;
  }
  return tokens;
}
