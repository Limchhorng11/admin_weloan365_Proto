import { PageHeader } from "@/components/page-header";
import { TableToolbar } from "@/components/table-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { ANNOUNCEMENTS } from "@/lib/data";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Announcements" subtitle="Broadcast to customer app" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <TableToolbar action="New Announcement" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["ID", "Title", "Audience", "Status", "Date"].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">{h}</th>
              ))}
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {ANNOUNCEMENTS.map(a => (
              <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{a.id}</td>
                <td className="px-6 py-3.5 font-medium text-gray-900">{a.title}</td>
                <td className="px-6 py-3.5 text-gray-700">{a.audience}</td>
                <td className="px-6 py-3.5"><StatusBadge status={a.status} /></td>
                <td className="px-6 py-3.5 text-gray-600 text-xs">{a.date}</td>
                <td className="px-6 py-3.5 text-right">
                  <button className="text-xs text-brand-600 hover:underline font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
