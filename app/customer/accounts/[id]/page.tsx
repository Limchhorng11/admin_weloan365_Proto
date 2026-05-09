"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Pencil,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Lock,
} from "lucide-react";
import { CUSTOMERS, APPLICATIONS } from "@/lib/data";
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
              <div className="text-sm text-gray-500">
                {c.phone} • {c.email}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={kycStatus} />
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              Send message
            </button>
            {can("customer.edit") && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
                <Pencil className="w-4 h-4 text-gray-500" />
                Edit profile
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
            Address
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              #123, St. 271, Sangkat BKK1,
              <br />
              Phnom Penh, Cambodia
            </div>
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
                {["App ID", "Product", "Amount", "Term", "Rate", "Status"].map(h => (
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
                  <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{a.id}</td>
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
