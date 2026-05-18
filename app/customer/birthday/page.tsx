"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Cake, X, Pencil, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const UPCOMING = [
  { name: "Sokha Chan", date: "Apr 23 (in 2 days)", age: 31, status: "Scheduled" },
  { name: "Dara Meas",  date: "Apr 25 (in 4 days)", age: 42, status: "Scheduled" },
  { name: "Pisey Ros",  date: "Apr 28 (in 7 days)", age: 27, status: "Draft" },
  { name: "Vichet Lim", date: "May 2",              age: 35, status: "Scheduled" },
];

const DEFAULT_TEMPLATE = {
  title: "Happy Birthday, {{name}}!",
  body:
    "Wishing you a wonderful year ahead filled with happiness, good health, " +
    "and success. Thank you for being part of the WeLoan365 family.",
};

export default function BirthdayPage() {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Birthday Notifications" subtitle="Automated happy-birthday messages" />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Upcoming — next 14 days</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Customer", "Birthday", "Turning", "Status"].map(h => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-[12px] font-medium text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UPCOMING.map(u => (
                <tr
                  key={u.name}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-3.5 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-3.5 text-gray-700">{u.date}</td>
                  <td className="px-6 py-3.5 text-gray-700">{u.age}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-900">Message template</h2>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-3">
            <Cake className="w-6 h-6 text-pink-500 mb-2" />
            <div className="font-medium text-gray-900">{template.title}</div>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
              {template.body}
            </p>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="mt-3 w-full py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 inline-flex items-center justify-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-500" />
            Edit template
          </button>
          <button className="mt-2 w-full py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 inline-flex items-center justify-center gap-1.5 font-medium">
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      <EditTemplateModal
        open={editOpen}
        initial={template}
        onClose={() => setEditOpen(false)}
        onSave={next => {
          setTemplate(next);
          setEditOpen(false);
        }}
        onReset={() => setTemplate(DEFAULT_TEMPLATE)}
      />
    </div>
  );
}

/* ---------- edit template modal ---------- */

function EditTemplateModal({
  open,
  initial,
  onClose,
  onSave,
  onReset,
}: {
  open: boolean;
  initial: { title: string; body: string };
  onClose: () => void;
  onSave: (next: { title: string; body: string }) => void;
  onReset: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);

  // Reset local state whenever the modal opens with new initial values.
  useEffect(() => {
    if (open) {
      setTitle(initial.title);
      setBody(initial.body);
    }
  }, [open, initial.title, initial.body]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isDirty = title !== initial.title || body !== initial.body;
  const canSave = title.trim().length > 0 && body.trim().length > 0;

  // Render-time preview substitution for the customer name token.
  const previewTitle = title.replace(/\{\{\s*name\s*\}\}/g, "Sokha Chan");
  const previewBody  = body.replace(/\{\{\s*name\s*\}\}/g, "Sokha Chan");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900">Edit message template</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Customise the birthday wish sent to customers. Use{" "}
              <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">
                {"{{name}}"}
              </code>{" "}
              to insert the customer's first name.
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

        {/* Form + Preview */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 grid grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Happy Birthday, {{name}}!"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Message body</label>
                <span className={cn(
                  "text-[11px]",
                  body.length > 240 ? "text-red-600" : "text-gray-400"
                )}>
                  {body.length} / 240
                </span>
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={7}
                maxLength={240}
                placeholder="Wishing you a wonderful year ahead…"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
              <div className="text-[11px] text-gray-400 mt-1.5">
                Tip: keep the wish warm and personal — no promotions or discounts.
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <label className="text-xs font-medium text-gray-700">Preview</label>
            <div className="mt-1 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <Cake className="w-6 h-6 text-pink-500 mb-2" />
              <div className="font-medium text-gray-900">
                {previewTitle || (
                  <span className="text-gray-400 italic">Title preview…</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                {previewBody || (
                  <span className="text-gray-400 italic">Message preview…</span>
                )}
              </p>
            </div>
            <div className="text-[11px] text-gray-500 mt-2">
              Preview uses <span className="font-medium">Sokha Chan</span> as the
              customer name.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to default
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave({ title, body })}
              disabled={!isDirty || !canSave}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md",
                isDirty && canSave
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
