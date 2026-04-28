import { PageHeader } from "@/components/page-header";
import { TableToolbar } from "@/components/table-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { PRODUCTS } from "@/lib/data";

export default function ProductsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Loan Products"
        subtitle="Management of all loan products + detail"
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <TableToolbar action="Create Product" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["Product ID", "Name", "Amount range", "Rate", "Term", "Active loans", "Status"].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">{h}</th>
              ))}
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map(p => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{p.id}</td>
                <td className="px-6 py-3.5 font-medium text-gray-900">{p.name}</td>
                <td className="px-6 py-3.5 text-gray-700">${p.min.toLocaleString()} – ${p.max.toLocaleString()}</td>
                <td className="px-6 py-3.5 text-gray-700">{p.rateMin}% – {p.rateMax}%</td>
                <td className="px-6 py-3.5 text-gray-700">{p.termMin}–{p.termMax}m</td>
                <td className="px-6 py-3.5 text-gray-700">{p.loans}</td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={p.status === "active" ? "Active" : "Draft"} />
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button className="text-xs text-brand-600 hover:underline font-medium">Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
