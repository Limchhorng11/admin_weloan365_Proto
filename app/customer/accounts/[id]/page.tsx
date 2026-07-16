"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { CUSTOMERS, APPLICATIONS, CONSULTATIONS, FEEDBACK } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";
import { ChangePinModal } from "@/components/change-pin-modal";
import { useRole } from "@/lib/role-context";
import { useFeedbackResponses } from "@/lib/feedback-store";
import { formatDate } from "@/lib/utils";

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const c = CUSTOMERS.find(x => x.id === params.id);
  if (!c) return notFound();

  const { role, can } = useRole();
  const [pinOpen, setPinOpen] = useState(false);
  // When opened from the chat customer-info link (…?from=chat), this is a
  // support context — hide the loan applications section.
  const [fromChat, setFromChat] = useState(false);

  // Feedback replies — read from the shared store so the customer detail page
  // and the Consult & Feedback inbox stay in sync. Replying happens on the inbox.
  const responses = useFeedbackResponses();

  // Read URL params on mount: auto-open Change PIN (…?action=change-pin) and
  // detect the chat support context (…?from=chat).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "change-pin" && can("customer.pin_reset")) {
      setPinOpen(true);
    }
    setFromChat(params.get("from") === "chat");
  }, [can]);

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
          </div>
        </div>
      </div>

      {/* Profile information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {c.loans === 0 ? (
            // New customer — no loan history yet, so nothing beyond the basic
            // signup details has been collected. The full KYC / employment
            // profile below is only captured on a customer's first loan
            // application.
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
                Personal information
              </div>
              <dl className="divide-y divide-gray-100">
                <Row label="Full name" value={c.name} />
                <Row label="Phone" value={<span className="font-mono text-xs">{c.phone}</span>} />
              </dl>
              <div className="mt-4 text-xs text-gray-400">
                Full profile is collected when the customer submits their first loan application.
              </div>
            </div>
          ) : null}

          {c.loans === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
                Referral
              </div>
              {c.referral ? (
                <dl className="divide-y divide-gray-100">
                  <Row label="Referral code" value={<span className="font-mono text-xs">{c.referral.code}</span>} />
                  <Row label="Referred by" value={c.referral.officer} />
                </dl>
              ) : (
                <div className="text-xs text-gray-400">Direct signup — no referral.</div>
              )}
              {c.referral && (
                <div className="mt-4 text-xs text-gray-400">
                  Reward is credited to the officer once this customer's first loan is disbursed.
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
                  Personal profile
                </div>
                <dl className="divide-y divide-gray-100">
                  <Row label="Full name" value={c.name} />
                  <Row label="Mobile" value={<span className="font-mono text-xs">{c.phone}</span>} />
                  <Row label="National ID" value={<span className="font-mono text-xs">{c.nationalId}</span>} />
                  <Row label="Birth date" value={formatDate(c.dob)} />
                  <Row label="Marital status" value={c.maritalStatus} />
                  <Row label="Address" value={c.address} />
                  <Row label="Branch" value={c.branch} />
                </dl>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
                  Residential address
                </div>
                <dl className="divide-y divide-gray-100">
                  <Row label="City / Province" value={c.profile.address.cityProvince} />
                  <Row label="District / Khan" value={c.profile.address.district} />
                  <Row label="Commune / Sangkat" value={c.profile.address.commune} />
                  <Row label="Village" value={c.profile.address.village} />
                  <Row label="House No · Street No" value={c.profile.address.houseStreet} />
                </dl>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
                  Employment details
                </div>
                <dl className="divide-y divide-gray-100">
                  <Row label="Employment type" value={c.profile.employment.type} />
                  <Row label="Occupation / Position" value={c.occupation} />
                  <Row label="Company name" value={c.profile.employment.companyName} />
                  <Row label="Business type" value={c.profile.employment.businessType} />
                  <Row label="Business nature" value={c.profile.employment.businessNature} />
                  <Row label="Main source of income" value={c.profile.employment.incomeSource} />
                  <Row label="Monthly range" value={c.profile.employment.incomeRange} />
                </dl>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
                  Referral
                </div>
                {c.referral ? (
                  <dl className="divide-y divide-gray-100">
                    <Row label="Referral code" value={<span className="font-mono text-xs">{c.referral.code}</span>} />
                    <Row label="Referred by" value={c.referral.officer} />
                    <Row label="Referral date" value={formatDate(c.referral.date)} />
                  </dl>
                ) : (
                  <div className="text-xs text-gray-400">Direct signup — no referral.</div>
                )}
              </div>
            </>
          )}
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

          {/* Complaint */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-3">
              Complaint
            </div>
            {custFeedback.length === 0 ? (
              <div className="text-xs text-gray-400">No complaints yet.</div>
            ) : (
              <ul className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                {custFeedback.map(fb => (
                  <li
                    key={fb.id}
                    className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5"
                  >
                    {/* Date */}
                    <div className="text-[11px] text-gray-400">{fb.date}</div>

                    {/* Comment */}
                    <div className="text-sm text-gray-800 mt-1">{fb.text}</div>

                    {/* Reply (from shared store), or an awaiting-reply status */}
                    {responses[fb.id] ? (
                      <div className="mt-2 rounded-md bg-white border border-gray-100 px-2.5 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-0.5">
                          Officer reply
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {responses[fb.id].message}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/customer/feedback?feedback=${fb.id}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber-700 hover:text-amber-800 hover:underline"
                        title="Reply to this complaint in the inbox"
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Awaiting reply
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Customer's applications — gated by loan.view */}
      {can("loan.view") && !fromChat && (
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
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
          </div>
        )}
      </div>
      )}

      {pinOpen && (
        <ChangePinModal customerName={c.name} onClose={() => setPinOpen(false)} />
      )}
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
