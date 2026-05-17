"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TableToolbar } from "@/components/table-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { CUSTOMERS, BRANCHES, type Customer } from "@/lib/data";
import { ChevronLeft, ChevronRight, ArrowUpDown, X } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [open, setOpen] = useState(false);

  const nextId = useMemo(() => {
    const maxN = customers.reduce((m, c) => {
      const n = parseInt(c.id.replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `C-${String(maxN + 1).padStart(4, "0")}`;
  }, [customers]);

  const handleSave = (input: Omit<Customer, "id" | "loans" | "joined">) => {
    const today = new Date().toISOString().slice(0, 10);
    const created: Customer = {
      id: nextId,
      loans: 0,
      joined: today,
      ...input,
    };
    setCustomers(prev => [created, ...prev]);
    setOpen(false);
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="All Customer Accounts"
        subtitle={`${customers.length} records`}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <TableToolbar action="Add Customer" onActionClick={() => setOpen(true)} />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["ID", "Name", "Phone", "Email", "KYC", "Loans", "Branch"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      {h}
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    </span>
                  </th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                  <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{c.id}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                        {c.name.split(" ").map(s => s[0]).join("")}
                      </div>
                      <span className="text-gray-900 font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">{c.phone}</td>
                  <td className="px-6 py-3.5 text-gray-600 text-xs">{c.email}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge
                      status={c.kyc === "verified" ? "Verified" : c.kyc === "pending" ? "Pending" : "Rejected"}
                    />
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">{c.loans}</td>
                  <td className="px-6 py-3.5 text-gray-600">{c.branch}</td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={`/customer/accounts/${c.id}`}
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

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
          <div>
            Showing <span className="font-medium text-gray-700">1-{customers.length}</span> of{" "}
            <span className="font-medium text-gray-700">{customers.length}</span>
          </div>
          <div className="flex gap-1">
            <button className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <AddCustomerModal
        open={open}
        nextId={nextId}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

function AddCustomerModal({
  open,
  nextId,
  onClose,
  onSave,
}: {
  open: boolean;
  nextId: string;
  onClose: () => void;
  onSave: (input: Omit<Customer, "id" | "loans" | "joined">) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0]?.name ?? "");
  const [kyc, setKyc] = useState<Customer["kyc"]>("pending");
  const [refCode, setRefCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setBranch(BRANCHES[0]?.name ?? "");
    setKyc("pending");
    setRefCode("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    if (!phone.trim()) return setError("Phone is required");
    if (refCode && !/^\d{5}$/.test(refCode)) return setError("Referral code must be 5 digits");
    onSave({ name: name.trim(), phone: phone.trim(), email: email.trim(), branch, kyc });
    reset();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-14 px-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Add Customer</div>
            <div className="text-[11px] text-gray-500">New customer ID will be {nextId}</div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Full name *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sokha Chan"
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Phone *</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+855 12 345 678"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@mail.com"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Branch</label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">KYC status</label>
              <select
                value={kyc}
                onChange={e => setKyc(e.target.value as Customer["kyc"])}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">CO referral code</label>
            <input
              value={refCode}
              onChange={e => setRefCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="5-digit code (optional)"
              inputMode="numeric"
              maxLength={5}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <div className="text-[11px] text-gray-500 mt-1">
              Optional. The 5-digit code given to the customer by their Credit Officer.
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
            >
              Save customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
