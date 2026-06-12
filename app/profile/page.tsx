"use client";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useRole } from "@/lib/role-context";
import { PERMISSIONS } from "@/lib/data";
import { Mail, Building2, ShieldCheck, CircleDollarSign, Crown } from "lucide-react";

export default function ProfilePage() {
  const { user, role } = useRole();
  const initials = user.name.split(" ").map(s => s[0]).join("");

  const fmtLimit = (n: number | null) =>
    n === null ? "Unlimited" : n === 0 ? "Cannot approve" : "$" + n.toLocaleString();
  const grantedCount =
    role.permissions === "*" ? PERMISSIONS.length : role.permissions.length;

  return (
    <div className="space-y-6 max-w-[900px]">
      <PageHeader title="My profile" subtitle="Your account and role details." />

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center text-base font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-semibold text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
              {role.key === "admin" && <Crown className="w-3 h-3 text-amber-500" />}
              <ShieldCheck className="w-3 h-3" />
              {role.name}
            </span>
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Account */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
            Account
          </div>
          <dl className="divide-y divide-gray-100">
            <Row label="Full name" value={user.name} />
            <Row
              label="Email"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {user.email}
                </span>
              }
            />
            <Row
              label="Branch"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {user.branch}
                </span>
              }
            />
            <Row label="Status" value={<StatusBadge status={user.status} />} />
            <Row label="Last active" value={user.lastActive} />
          </dl>
        </div>

        {/* Role & permissions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
            Role &amp; permissions
          </div>
          <dl className="divide-y divide-gray-100">
            <Row label="Role" value={role.name} />
            <Row label="Description" value={<span className="text-right">{role.description}</span>} />
            <Row
              label="Approval limit"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <CircleDollarSign className="w-3.5 h-3.5 text-gray-400" />
                  {fmtLimit(role.approvalLimit)}
                </span>
              }
            />
            <Row label="Permissions" value={`${grantedCount} / ${PERMISSIONS.length} granted`} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 gap-4">
      <dt className="text-gray-500 text-sm flex-shrink-0">{label}</dt>
      <dd className="text-gray-900 text-sm text-right">{value}</dd>
    </div>
  );
}
