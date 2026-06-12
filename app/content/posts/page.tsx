"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  POSTS,
  POST_CATEGORIES,
  type Post,
  type PostCategoryId,
  type PostStatus,
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
} from "lucide-react";

const PAGE_SIZE = 8;

const CATEGORY_TONE: Record<string, string> = {
  blue:    "bg-sky-50 text-sky-700",
  violet:  "bg-violet-50 text-violet-700",
  amber:   "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose:    "bg-rose-50 text-rose-700",
};

function categoryMeta(id: PostCategoryId) {
  return POST_CATEGORIES.find(c => c.id === id) ?? POST_CATEGORIES[0];
}

function CategoryBadge({ id }: { id: PostCategoryId }) {
  const c = categoryMeta(id);
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

export default function PostsPage() {
  const { can, user } = useRole();
  const canEdit = can("post.manage");

  const [list, setList]       = useState<Post[]>(POSTS);
  const [query, setQuery]     = useState("");
  const [category, setCategory] = useState<"all" | PostCategoryId>("all");
  const [page, setPage]       = useState(1);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing]       = useState<Post | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(p => {
      if (category !== "all" && p.category !== category) return false;
      if (q && !`${p.title} ${p.excerpt} ${p.author}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, query, category]);

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
      <PageHeader
        title="Blog Posts"
        subtitle="Publish blog articles, news, announcements and more to the customer mobile app."
      />

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

        {/* Category filter chips */}
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
            All ({list.length})
          </button>
          {POST_CATEGORIES.map(c => {
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
                      <Thumb url={p.thumbnail} category={p.category} />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate max-w-[320px]">
                          {p.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[320px] mt-0.5">
                          {p.excerpt}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <CategoryBadge id={p.category} />
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

function Thumb({ url, category }: { url: string; category: PostCategoryId }) {
  const c = categoryMeta(category);
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="w-12 h-12 rounded-md object-cover bg-gray-100 flex-shrink-0"
      />
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
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Post | null;
  nextId: string;
  authorName: string;
  onClose: () => void;
  onSave: (p: Post) => void;
}) {
  const isEdit = !!initial;

  const [title, setTitle]         = useState("");
  const [category, setCategory]   = useState<PostCategoryId>("blog");
  const [excerpt, setExcerpt]     = useState("");
  const [body, setBody]           = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [status, setStatus]       = useState<PostStatus>("Draft");
  const [error, setError]         = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Init / reset whenever the modal opens
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setCategory(initial.category);
      setExcerpt(initial.excerpt);
      setBody(initial.body);
      setThumbnail(initial.thumbnail);
      setStatus(initial.status);
    } else {
      setTitle("");
      setCategory("blog");
      setExcerpt("");
      setBody("");
      setThumbnail("");
      setStatus("Draft");
    }
    setError(null);
    setShowPreview(false);
  }, [open, initial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  /* ---- Formatting toolbar ---- */
  const wrap = (before: string, after: string = before) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = body.slice(start, end) || "text";
    const next =
      body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
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
    const lineStart = body.lastIndexOf("\n", start - 1) + 1;
    const next = body.slice(0, lineStart) + prefix + body.slice(lineStart);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const insertLink = () => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = body.slice(start, end) || "link text";
    const snippet = `[${selected}](https://)`;
    setBody(body.slice(0, start) + snippet + body.slice(end));
  };

  /* ---- Thumbnail upload ---- */
  const onPickFile = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please pick an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setThumbnail(String(reader.result || ""));
    reader.readAsDataURL(file);
    setError(null);
  };

  /* ---- Submit ---- */
  const validate = (): string | null => {
    if (!title.trim()) return "Title is required.";
    if (!excerpt.trim()) return "A short excerpt is required.";
    if (!body.trim()) return "Article body can't be empty.";
    return null;
  };

  const submit = (s: PostStatus) => {
    const err = validate();
    if (err) return setError(err);
    const post: Post = {
      id: initial?.id ?? nextId,
      title: title.trim(),
      category,
      excerpt: excerpt.trim(),
      body: body.trim(),
      thumbnail,
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

          {showPreview ? (
            <PostPreview
              title={title}
              category={category}
              excerpt={excerpt}
              body={body}
              thumbnail={thumbnail}
              author={initial?.author ?? authorName}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main editor area */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Title *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. 5 tips before taking your first loan"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Short excerpt *</label>
                  <input
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    placeholder="One-line summary shown in the app's feed"
                    maxLength={140}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <div className="text-[11px] text-gray-400 mt-1">
                    {excerpt.length} / 140
                  </div>
                </div>

                {/* Body with formatting toolbar */}
                <div>
                  <label className="text-xs font-medium text-gray-700">Article body *</label>
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
                      value={body}
                      onChange={e => setBody(e.target.value)}
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
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-gray-700">Category *</label>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {POST_CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={cn(
                          "px-2 py-1.5 text-xs rounded-md border text-left",
                          category === c.id
                            ? cn("border-2", CATEGORY_TONE[c.tone])
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Thumbnail</label>
                  <div className="mt-1.5">
                    {thumbnail ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnail}
                          alt="thumbnail preview"
                          className="w-full h-32 object-cover rounded-md border border-gray-200"
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
                            onClick={() => setThumbnail("")}
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
                        className="w-full h-32 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-brand-700 transition"
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
  excerpt,
  body,
  thumbnail,
  author,
}: {
  title: string;
  category: PostCategoryId;
  excerpt: string;
  body: string;
  thumbnail: string;
  author: string;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <CategoryBadge id={category} />
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mt-2">
        {title || <span className="text-gray-400 italic">Untitled</span>}
      </h1>
      <p className="text-sm text-gray-600 mt-2">
        {excerpt || <span className="text-gray-400 italic">Add a one-line excerpt</span>}
      </p>
      <div className="text-xs text-gray-400 mt-2">By {author}</div>

      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className="mt-5 w-full h-56 object-cover rounded-lg border border-gray-200"
        />
      )}

      <div className="prose-sm mt-6">
        {body ? (
          <RenderMarkdown text={body} />
        ) : (
          <p className="text-gray-400 italic">Article body preview…</p>
        )}
      </div>
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
