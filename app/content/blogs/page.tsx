import { PageHeader } from "@/components/page-header";
import { TableToolbar } from "@/components/table-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { BLOGS } from "@/lib/data";

export default function BlogsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Blogs" subtitle="Financial education content" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <TableToolbar action="New Post" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["ID", "Title", "Author", "Status", "Views", "Date"].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">{h}</th>
              ))}
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {BLOGS.map(b => (
              <tr key={b.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{b.id}</td>
                <td className="px-6 py-3.5 font-medium text-gray-900">{b.title}</td>
                <td className="px-6 py-3.5 text-gray-700">{b.author}</td>
                <td className="px-6 py-3.5"><StatusBadge status={b.status} /></td>
                <td className="px-6 py-3.5 text-gray-700">{b.views.toLocaleString()}</td>
                <td className="px-6 py-3.5 text-gray-600 text-xs">{b.date}</td>
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
