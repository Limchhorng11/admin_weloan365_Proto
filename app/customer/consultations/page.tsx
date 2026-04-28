import { PageHeader } from "@/components/page-header";
import { TableToolbar } from "@/components/table-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { CONSULTATIONS } from "@/lib/data";

export default function ConsultationsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Consultation Requests" subtitle={`${CONSULTATIONS.length} requests`} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <TableToolbar action="Assign to me" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["ID", "Customer", "Topic", "Requested", "Status", "Officer"].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">{h}</th>
              ))}
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {CONSULTATIONS.map(c => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{c.id}</td>
                <td className="px-6 py-3.5 font-medium text-gray-900">{c.customer}</td>
                <td className="px-6 py-3.5 text-gray-700">{c.topic}</td>
                <td className="px-6 py-3.5 text-gray-600 text-xs">{c.requested}</td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={c.status === "open" ? "Open" : c.status === "closed" ? "Closed" : "Pending"} />
                </td>
                <td className="px-6 py-3.5 text-gray-600">{c.officer}</td>
                <td className="px-6 py-3.5 text-right">
                  <button className="text-xs text-brand-600 hover:underline font-medium">Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
