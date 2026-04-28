import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  CircleDollarSign,
  CheckCircle2,
  FileX,
  Clock,
  Search,
  SlidersHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { BarChart } from "@/components/bar-chart";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { APPLICATIONS, CHART_DATA } from "@/lib/data";

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">
          Welcome back, Laybun!
        </h1>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>This Month</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Chart + KPI grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-card">
          <div className="flex items-center gap-1 mb-6">
            <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-900">
              Total Volume
            </button>
            <button className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 hover:bg-gray-50">
              Avg. Value
            </button>
          </div>
          <BarChart data={CHART_DATA} />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            icon={CircleDollarSign}
            label="Total Volume"
            value="$110,100.00"
            delta="+8%"
            deltaTone="up"
          />
          <KpiCard
            icon={FileX}
            label="Overdue Loans"
            value="4 Failed"
            delta="+2"
            deltaTone="down"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Completed Loans"
            value="24 Completed"
            delta="+7"
            deltaTone="up"
          />
          <KpiCard
            icon={Clock}
            label="Avg. Loan Value"
            value="$11,540"
            delta="-0.4%"
            deltaTone="down"
          />
        </div>
      </div>

      {/* Applications table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[17px] font-semibold text-gray-900">Loan Applications</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-56"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <span>Filter</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
              <Plus className="w-4 h-4" />
              <span>New Application</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["ID", "Name", "Branch", "Loan range", "Sent", "Status"].map(h => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-[12px] font-medium text-gray-500"
                  >
                    <span className="inline-flex items-center gap-1">
                      {h}
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {APPLICATIONS.map(r => (
                <tr
                  key={r.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-3.5 text-gray-700">{r.id}</td>
                  <td className="px-6 py-3.5 text-gray-900 font-medium">{r.name}</td>
                  <td className="px-6 py-3.5 text-gray-600">{r.branch}</td>
                  <td className="px-6 py-3.5 text-gray-700">{r.range}</td>
                  <td className="px-6 py-3.5 text-gray-600">{r.sent}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
          <div>
            Showing <span className="font-medium text-gray-700">1-{APPLICATIONS.length}</span> of{" "}
            <span className="font-medium text-gray-700">100</span>
          </div>
          <div className="flex gap-1">
            <button className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick links to key flows */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          href="/customer/applications"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-card transition"
        >
          <div className="text-[13px] text-gray-500">Review pending applications</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">47 awaiting review →</div>
        </Link>
        <Link
          href="/customer/consultations"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-card transition"
        >
          <div className="text-[13px] text-gray-500">Open consultations</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">3 new requests →</div>
        </Link>
        <Link
          href="/chat"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-card transition"
        >
          <div className="text-[13px] text-gray-500">Customer chat</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">3 unread →</div>
        </Link>
      </div>
    </div>
  );
}
