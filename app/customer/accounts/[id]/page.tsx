"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Lock,
  X,
} from "lucide-react";
import { CUSTOMERS, APPLICATIONS, CONSULTATIONS, FEEDBACK } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";
import { useRole } from "@/lib/role-context";

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const c = CUSTOMERS.find(x => x.id === params.id);
  if (!c) return notFound();

  const { role, can } = useRole();
  const [pinOpen, setPinOpen] = useState(false);

  // Block the entire page if the role can't even view customers.
  if (!can("customer.view")) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl border border-gray-200 p-10 text-center shadow-card">
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">No access</h2>
        <p className="text-sm text-gray-500 mt-1">
          The <span className="font-medium">{role.name}</span> role cannot view customer profiles.
        </p>
      </div>
    );
  }

  const initials = c.name.split(" ").map(s => s[0]).join("");
  const kycStatus =
    c.kyc === "verified" ? "Verified" : c.kyc === "pending" ? "Pending" : "Rejected";

  const customerApps = APPLICATIONS.filter(a => a.cid === c.id);
  const custConsults = CONSULTATIONS.filter(rc => rc.customer === c.name);
  const custFeedback = FEEDBACK.filter(fb => fb.customer === c.name);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <Link
        href="/customer/accounts"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to customers
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <div className="flex items-start justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center text-base font-semibold">
              {initials}
            </div>
            <div>
              <div className="text-xs font-mono text-gray-500">{c.id}</div>
              <div className="text-xl font-semibold text-gray-900">{c.name}</div>
              <div className="text-sm text-gray-500">{c.phone}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={kycStatus} />
            {can("customer.pin_reset") && (
              <button
                onClick={() => setPinOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700"
              >
                <KeyRound className="w-4 h-4 text-gray-500" />
                Change pin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile information */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
            Personal information
          </div>
          <dl className="divide-y divide-gray-100">
            <Row label="Customer ID" value={<span className="font-mono text-xs">{c.id}</span>} />
            <Row label="Full name" value={c.name} />
            <Row
              label="Phone"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {c.phone}
                </span>
              }
            />
            <Row
              label="Email"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {c.email}
                </span>
              }
            />
            <Row
              label="Branch"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {c.branch}
                </span>
              }
            />
            <Row
              label="Address"
              value={
                <span className="inline-flex items-start gap-1.5 text-right">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  {c.address}
                </span>
              }
            />
            <Row
              label="Joined"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {c.joined}
                </span>
              }
            />
            <Row label="KYC status" value={<StatusBadge status={kycStatus} />} />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 space-y-5">
          {/* Consultations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                Consultations
              </div>
              <span className="text-[11px] text-gray-400">{custConsults.length}</span>
            </div>
            {custConsults.length === 0 ? (
              <div className="text-xs text-gray-400">No consultations yet.</div>
            ) : (
              <ul className="space-y-2.5">
                {custConsults.map(rc => (
                  <li
                    key={rc.id}
                    className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">{rc.topic}</span>
                      <StatusBadge
                        status={rc.status[0].toUpperCase() + rc.status.slice(1)}
                      />
                    </div>
                    {rc.note && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">{rc.note}</div>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-gray-500">
                      <span>{rc.requested}</span>
                      <span className="truncate">{rc.officer}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Feedback */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-3">
              Feedback
            </div>
            {custFeedback.length === 0 ? (
              <div className="text-xs text-gray-400">No feedback yet.</div>
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                {custFeedback.map(fb => (
                  <li key={fb.id}>
                    <div className="text-[11px] text-gray-400">{fb.date}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{fb.text}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Customer's applications — gated by loan.view */}
      {can("loan.view") && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Loan applications</h2>
          <span className="text-xs text-gray-500">
            {customerApps.length} record{customerApps.length === 1 ? "" : "s"}
          </span>
        </div>
        {customerApps.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No applications yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Product", "Amount", "Term", "Rate", "Status"].map(h => (
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
              {customerApps.map(a => (
                <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{a.product}</td>
                  <td className="px-6 py-3.5 text-gray-700">${a.amount.toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-gray-700">{a.term}m</td>
                  <td className="px-6 py-3.5 text-gray-700">{a.rate}%</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={`/customer/applications/${a.id}`}
                      className="text-xs text-brand-600 hover:underline font-medium"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {pinOpen && (
        <ChangePinModal customerName={c.name} onClose={() => setPinOpen(false)} />
      )}
    </div>
  );
}

function ChangePinModal({
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2.5">
      <dt className="text-gray-500 text-sm">{label}</dt>
      <dd className="text-gray-900 text-sm">{value}</dd>
    </div>
  );
}
