import { PageHeader } from "@/components/page-header";
import { FEEDBACK } from "@/lib/data";
import { Star } from "lucide-react";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5" fill={i < rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const avg = (FEEDBACK.reduce((s, f) => s + f.rating, 0) / FEEDBACK.length).toFixed(1);
  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Feedback & Rate" subtitle={`${FEEDBACK.length} entries`} />

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
          <div className="text-[13px] text-gray-500">Average rating</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-gray-900">{avg}</span>
            <Stars rating={Math.round(+avg)} />
          </div>
        </div>
        {[5, 4, 3].map(n => (
          <div key={n} className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
            <div className="text-[13px] text-gray-500">{n} stars</div>
            <div className="text-2xl font-semibold text-gray-900 mt-2">
              {FEEDBACK.filter(f => f.rating === n).length}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Customer feedback</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["ID", "Customer", "Rating", "Comment", "Date"].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEEDBACK.map(f => (
              <tr key={f.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className="px-6 py-3.5 text-gray-700 font-mono text-xs">{f.id}</td>
                <td className="px-6 py-3.5 font-medium text-gray-900">{f.customer}</td>
                <td className="px-6 py-3.5"><Stars rating={f.rating} /></td>
                <td className="px-6 py-3.5 text-gray-600">{f.text}</td>
                <td className="px-6 py-3.5 text-gray-500 text-xs">{f.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
