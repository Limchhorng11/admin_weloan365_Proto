import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TableToolbar } from "@/components/table-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { APPLICATIONS } from "@/lib/data";
import { ChevronLeft, ChevronRight, ArrowUpDown, Download } from "lucide-react";

export default function ApplicationsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Loan Applications"
        subtitle="Review and process all customer loan applications"
        actions={
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700">
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export</span>
          </button>
        }
      />

      <div className="flex gap-1 text-sm">
        {["All", "Pending", "Review", "Approved", "Disbursed", "Rejected"].map((t, i) => (
          <button
            key={t}
            className={`px-3 py-1.5 rounded-md ${
              i === 0 ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-white border border-transparent hover:border-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <TableToolbar action="New Application" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["App ID", "Customer", "Branch", "Loan range", "Applied", "Status"].map(h => (
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
              {APPLICATIONS.map(r => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                  <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{r.id}</td>
                  <td className="px-6 py-3.5 text-gray-900 font-medium">{r.name}</td>
                  <td className="px-6 py-3.5 text-gray-600">{r.branch}</td>
                  <td className="px-6 py-3.5 text-gray-700">{r.range}</td>
                  <td className="px-6 py-3.5 text-gray-600">{r.sent}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-6 py-3.5 text-right">
                    <Link href={`/customer/applications/${r.id}`} className="text-xs text-brand-600 hover:underline font-medium">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
          <div>Showing <span className="font-medium text-gray-700">1-{APPLICATIONS.length}</span> of <span className="font-medium text-gray-700">100</span></div>
          <div className="flex gap-1">
            <button className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
