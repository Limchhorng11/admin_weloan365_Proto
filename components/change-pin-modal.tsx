"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function ChangePinModal({
  customerName,
  onClose,
}: {
  customerName: string;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // PIN is exactly 4 digits — strip anything else and cap at 4.
  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return setError("PIN must be exactly 4 digits.");
    if (pin !== confirm) return setError("PINs do not match.");
    setError(null);
    setDone(true);
  };

  const inputCls =
    "mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-center text-lg tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500";

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-14 px-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Change PIN</div>
            <div className="text-[11px] text-gray-500">{customerName} · 4-digit PIN</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="text-sm font-medium text-gray-900">PIN updated</div>
            <div className="text-xs text-gray-500 mt-1">
              {customerName}&apos;s 4-digit PIN has been changed.
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600">New PIN</label>
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(onlyDigits(e.target.value))}
                placeholder="••••"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={confirm}
                onChange={e => setConfirm(onlyDigits(e.target.value))}
                placeholder="••••"
                className={inputCls}
              />
            </div>
            <div className="text-[11px] text-gray-400">PIN must be exactly 4 digits.</div>

            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pin.length !== 4 || confirm.length !== 4}
                className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save PIN
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
