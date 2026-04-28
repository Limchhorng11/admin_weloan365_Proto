import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Cake } from "lucide-react";

const UPCOMING = [
  { name: "Sokha Chan", date: "Apr 23 (in 2 days)", age: 31, status: "Scheduled" },
  { name: "Dara Meas",  date: "Apr 25 (in 4 days)", age: 42, status: "Scheduled" },
  { name: "Pisey Ros",  date: "Apr 28 (in 7 days)", age: 27, status: "Draft" },
  { name: "Vichet Lim", date: "May 2",              age: 35, status: "Scheduled" },
];

export default function BirthdayPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Birthday Notifications" subtitle="Automated happy-birthday messages" />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Upcoming — next 14 days</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Customer", "Birthday", "Turning", "Status"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[12px] font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UPCOMING.map(u => (
                <tr key={u.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-3.5 text-gray-700">{u.date}</td>
                  <td className="px-6 py-3.5 text-gray-700">{u.age}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-900">Message template</h2>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-3">
            <Cake className="w-6 h-6 text-pink-500 mb-2" />
            <div className="font-medium text-gray-900">Happy Birthday, {"{{name}}"}!</div>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Wishing you a wonderful year ahead. Enjoy an exclusive 0.5% rate discount on your next loan — valid for 14 days.
            </p>
          </div>
          <button className="mt-3 w-full py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Edit template</button>
          <button className="mt-2 w-full py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">Auto-send settings</button>
        </div>
      </div>
    </div>
  );
}
