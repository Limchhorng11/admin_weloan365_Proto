"use client";

import { useEffect, useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Feedback } from "@/lib/data";
import type { FeedbackResponse } from "@/lib/feedback-store";

/**
 * Reply / edit-reply modal for a single piece of customer feedback.
 * Shared by the Consult & Feedback inbox and the customer detail page so the
 * reply experience is identical in both places.
 */
export function FeedbackResponseModal({
  feedback,
  existing,
  onClose,
  onSubmit,
}: {
  feedback: Feedback | null;
  existing?: FeedbackResponse;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (feedback) {
      setMessage(existing?.message ?? "");
    }
  }, [feedback, existing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && feedback) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [feedback, onClose]);

  if (!feedback) return null;

  const trimmedLen = message.trim().length;
  const canSend = trimmedLen > 0 && trimmedLen <= 280;
  const isEdit = !!existing;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit response" : "Reply to feedback"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              The reply will be delivered to{" "}
              <span className="font-medium text-gray-700">{feedback.customer}</span>&apos;s mobile app.
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

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {/* Original feedback */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold flex items-center justify-center">
                  {feedback.customer.split(" ").map(s => s[0]).join("")}
                </div>
                <div className="text-sm font-medium text-gray-900">{feedback.customer}</div>
              </div>
              <div className="text-[11px] text-gray-500 font-mono">{feedback.id} · {feedback.date}</div>
            </div>
            <div className="text-sm text-gray-700 mt-1">{feedback.text}</div>
          </div>

          {/* Reply textarea */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">Your response</label>
              <span className={cn(
                "text-[11px]",
                trimmedLen > 280 ? "text-red-600" : "text-gray-400"
              )}>
                {trimmedLen} / 280
              </span>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              maxLength={280}
              placeholder="Thank you for your feedback. We'll look into this and follow up shortly..."
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <div className="text-[11px] text-gray-400 mt-1">
              Sent as a push notification + in-app message in the customer mobile app.
            </div>
          </div>

          {existing && (
            <div className="text-[11px] text-emerald-700 inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              Previously sent on {existing.sentAt}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={() => canSend && onSubmit(message.trim())}
            disabled={!canSend}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md",
              canSend
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Send className="w-3.5 h-3.5" />
            {isEdit ? "Update response" : "Send response"}
          </button>
        </div>
      </div>
    </div>
  );
}
