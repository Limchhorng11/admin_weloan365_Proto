"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  X,
  MessageCircle,
  Phone,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import type { Application } from "@/lib/data";

/**
 * Re-structure request modal — shows the customer's reason + the requested
 * change, plus quick contact (chat / phone) and approve / decline actions.
 *
 * Used from both:
 *  - the loan applications list (badge next to customer name)
 *  - the application detail page (badge next to the Person in Charge card)
 */
export function RestructureRequestModal({
  application,
  onClose,
}: {
  application: Application | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && application) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [application, onClose]);

  if (!application || !application.restructureRequest) return null;
  const req = application.restructureRequest;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-gray-900">Re-structure request</div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                <span className="font-medium text-gray-700">{application.name}</span> ·{" "}
                <span className="font-mono">{application.id}</span> · {application.product} · $
                {application.amount.toLocaleString()} · {application.term}m
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Requested on {req.requestedAt}
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

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {/* Reason from customer */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">
              Reason from customer
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-sm text-gray-700 leading-relaxed">
              “{req.reason}”
            </div>
          </div>

          {/* Requested change */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">
              Requested change
            </div>
            <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-3 text-sm text-gray-800 leading-relaxed">
              {req.requestedChange}
            </div>
          </div>

          {/* Contact actions */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">
              Contact customer directly
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-sm text-gray-700 font-medium"
              >
                <MessageCircle className="w-4 h-4 text-brand-600" />
                Chat in app
              </Link>
              <a
                href={`tel:${req.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-sm text-gray-700 font-medium"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                Call {req.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50">
              <XCircle className="w-4 h-4" />
              Decline request
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Approve re-structure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
