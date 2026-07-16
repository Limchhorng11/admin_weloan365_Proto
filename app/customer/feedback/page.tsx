"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { FeedbackResponseModal } from "@/components/feedback-response-modal";
import { FEEDBACK } from "@/lib/data";
import { useFeedbackResponses, setFeedbackResponse, nowStamp } from "@/lib/feedback-store";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import { Pencil, Eye, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 8;

type Feedback = (typeof FEEDBACK)[number];

/* Parse "2026-04-21 09:12" or "2026-04-21" into a sortable timestamp. */
function parseTs(s: string): number {
  if (!s) return 0;
  const isoish = s.includes(" ") ? s.replace(" ", "T") : s;
  const n = Date.parse(isoish);
  return Number.isFinite(n) ? n : 0;
}

/* Truncate a long preview to ~80 chars with an ellipsis. */
function clip(s: string, max = 80): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;
}

export default function FeedbackPage() {
  /* ----- Replies live in the shared store (consistent with customer detail) ----- */
  const { user, can } = useRole();
  const canReply = can("feedback.reply");
  const responses = useFeedbackResponses();
  const [openId, setOpenId] = useState<string | null>(null);
  const activeFeedback = openId ? FEEDBACK.find(f => f.id === openId) ?? null : null;

  const submitResponse = (id: string, message: string) => {
    setFeedbackResponse(id, message, nowStamp(), user.name);
    setOpenId(null);
  };

  /* ----- Feedback, newest first ----- */
  const sorted = useMemo(
    () => [...FEEDBACK].sort((a, b) => parseTs(b.date) - parseTs(a.date)),
    []
  );

  const unrepliedCount = FEEDBACK.filter(f => !responses[f.id]).length;

  /* ----- Pagination ----- */
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const firstIdx = sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastIdx = Math.min(page * PAGE_SIZE, sorted.length);

  /* ----- Deep-link highlight (e.g. "Awaiting reply" on the customer page) ----- */
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("feedback");
    if (id) setHighlightId(id);
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const idx = sorted.findIndex(f => f.id === highlightId);
    if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE) + 1);
  }, [highlightId, sorted]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 6000);
    return () => clearTimeout(t);
  }, [highlightId]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Complaint"
        subtitle={`${FEEDBACK.length} complaints · ${unrepliedCount} unreplied`}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Table (md and up) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["Customer", "Subject", "Comment", "Date", "Status", "Action"].map(h => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-[12px] font-medium text-gray-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-500">
                    No complaints.
                  </td>
                </tr>
              ) : (
                paginated.map(f => (
                  <FeedbackRow
                    key={f.id}
                    f={f}
                    responded={!!responses[f.id]}
                    canReply={canReply}
                    highlight={f.id === highlightId}
                    onOpen={() => setOpenId(f.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginated.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-gray-500">No complaints.</div>
          ) : (
            paginated.map(f => {
              const responded = !!responses[f.id];
              const highlighted = f.id === highlightId;
              return (
                <div
                  key={f.id}
                  className={cn("px-4 py-3.5", highlighted && "animate-row-highlight")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">{f.customer}</span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">{f.date}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{f.subject}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{clip(f.text, 90)}</div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <StatusBadge status={responded ? "Replied" : "No reply"} />
                    {responded ? (
                      <button
                        onClick={() => setOpenId(f.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        Review
                      </button>
                    ) : canReply ? (
                      <button
                        onClick={() => setOpenId(f.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium"
                      >
                        <Pencil className="w-3 h-3" />
                        Reply
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
          <div>
            Showing{" "}
            <span className="font-medium text-gray-700">
              {firstIdx}-{lastIdx}
            </span>{" "}
            of <span className="font-medium text-gray-700">{sorted.length}</span>
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

      <FeedbackResponseModal
        feedback={activeFeedback}
        existing={activeFeedback ? responses[activeFeedback.id] : undefined}
        canReply={canReply}
        onClose={() => setOpenId(null)}
        onSubmit={msg => activeFeedback && submitResponse(activeFeedback.id, msg)}
      />
    </div>
  );
}

/* ---------- feedback table row ---------- */

function FeedbackRow({
  f,
  responded,
  canReply,
  highlight = false,
  onOpen,
}: {
  f: Feedback;
  responded: boolean;
  canReply: boolean;
  highlight?: boolean;
  onOpen: () => void;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);

  // When deep-linked from elsewhere, scroll the row into view so the pulse
  // animation is actually visible.
  useEffect(() => {
    if (highlight && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight]);

  return (
    <tr
      ref={rowRef}
      className={cn(
        "border-b border-gray-100 last:border-0 hover:bg-gray-50/60 cursor-pointer",
        highlight && "animate-row-highlight"
      )}
      onClick={onOpen}
    >
      <td className="px-6 py-3.5 font-medium text-gray-900">{f.customer}</td>
      <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">{f.subject}</td>
      <td className="px-6 py-3.5 text-gray-600 max-w-[360px]">
        <div className="truncate">{clip(f.text, 90)}</div>
      </td>
      <td className="px-6 py-3.5 text-gray-600 text-xs whitespace-nowrap">{f.date}</td>
      <td className="px-6 py-3.5">
        <StatusBadge status={responded ? "Replied" : "No reply"} />
      </td>
      <td className="px-6 py-3.5">
        {responded ? (
          <button
            onClick={e => {
              e.stopPropagation();
              onOpen();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium whitespace-nowrap"
          >
            <Eye className="w-3 h-3" />
            Review
          </button>
        ) : canReply ? (
          <button
            onClick={e => {
              e.stopPropagation();
              onOpen();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium whitespace-nowrap"
          >
            <Pencil className="w-3 h-3" />
            Reply
          </button>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
    </tr>
  );
}
