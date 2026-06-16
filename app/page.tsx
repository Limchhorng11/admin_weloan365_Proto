"use client";

import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  CheckCircle2,
  FileX,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { BarChart } from "@/components/bar-chart";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { DateRangeMenu, type DateRange } from "@/components/date-range-menu";
import { APPLICATIONS, CHART_DATA } from "@/lib/data";
import { DashboardQuickLinks } from "@/components/dashboard-quick-links";
import { downloadSpreadsheet } from "@/lib/export-spreadsheet";

/* ---------- date-range filtering ----------
   The mock data is dated around April 2026, so we anchor "now" to the most
   recent application date in the dataset. That keeps every range (week,
   month, quarter, year) producing sensible, non-empty results for the demo. */

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseSent(s: string): Date | null {
  const m = s.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1]];
  if (month === undefined) return null;
  return new Date(Number(m[3]), month, Number(m[2]));
}

const REFERENCE_DATE: Date =
  APPLICATIONS.reduce<Date | null>((max, a) => {
    const d = parseSent(a.sent);
    return d && (!max || d > max) ? d : max;
  }, null) ?? new Date(2026, 3, 21);

const quarterOf = (d: Date) => Math.floor(d.getMonth() / 3);

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inRange(sent: string, range: DateRange): boolean {
  if (range === "All time") return true;
  const d = parseSent(sent);
  if (!d) return false;
  const ref = REFERENCE_DATE;
  switch (range) {
    case "This Year":
      return d.getFullYear() === ref.getFullYear();
    case "This Quarter":
      return d.getFullYear() === ref.getFullYear() && quarterOf(d) === quarterOf(ref);
    case "This Month":
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    case "This Week": {
      const start = startOfWeek(ref);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return d >= start && d < end;
    }
    default:
      return true;
  }
}

const fmtUSD = (n: number) => "$" + n.toLocaleString("en-US");

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>("This Month");

  // Everything below derives from the selected range, so the dashboard and the
  // export always agree.
  const apps = useMemo(() => APPLICATIONS.filter(a => inRange(a.sent, range)), [range]);

  const totalVolume = apps.reduce((s, a) => s + a.amount, 0);
  const approved = apps.filter(a => a.status === "Approved").length;
  const rejected = apps.filter(a => a.status === "Rejected").length;
  const inProgress = apps.filter(a => a.status === "Progress").length;
  const avgValue = apps.length ? Math.round(totalVolume / apps.length) : 0;

  const handleExport = () => {
    const now = new Date();
    downloadSpreadsheet(
      `weloan365-dashboard-${range.replace(/\s+/g, "-").toLowerCase()}`,
      [
        {
          name: "Summary",
          title: "WeLoan365 — Dashboard Export",
          meta: [
            `Date range: ${range}`,
            `Generated: ${now.toLocaleString()}`,
            `Applications in range: ${apps.length}`,
          ],
          headers: ["Metric", "Value"],
          widths: [220, 160],
          rows: [
            ["Total volume", fmtUSD(totalVolume)],
            ["Applications", apps.length],
            ["Approved", approved],
            ["In progress", inProgress],
            ["Rejected", rejected],
            ["Average loan value", apps.length ? fmtUSD(avgValue) : "$0"],
          ],
        },
        {
          name: "Applications",
          title: "Loan Applications",
          meta: [`Date range: ${range}`],
          headers: [
            "Application ID", "Customer", "Product", "Amount (USD)",
            "Term (months)", "Rate (%)", "Credit score", "Branch",
            "Officer", "Sent", "Status",
          ],
          widths: [110, 130, 200, 110, 100, 80, 100, 180, 110, 110, 100],
          moneyColumns: [3],
          rows: apps.map(a => [
            a.id, a.name, a.product, a.amount, a.term, a.rate,
            a.score, a.branch, a.officer, a.sent, a.status,
          ]),
        },
        {
          name: "Monthly Volume",
          title: "Monthly Volume (annual trend)",
          headers: ["Month", "Volume (USD)"],
          widths: [120, 140],
          moneyColumns: [1],
          rows: CHART_DATA.map(d => [d.label, d.value]),
        },
      ]
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Greeting + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900">
          Welcome back, Visal!
        </h1>
        <div className="flex items-center gap-2">
          <DateRangeMenu value={range} onChange={setRange} />
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
            title="Export the current view to Excel"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
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

        {/* KPI cards — computed from the filtered applications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            icon={CircleDollarSign}
            label="Total Volume"
            value={fmtUSD(totalVolume)}
          />
          <KpiCard
            icon={CheckCircle2}
            label="Approved"
            value={String(approved)}
          />
          <KpiCard
            icon={FileX}
            label="Rejected"
            value={String(rejected)}
          />
          <KpiCard
            icon={Clock}
            label="Avg. Loan Value"
            value={apps.length ? fmtUSD(avgValue) : "$0"}
          />
        </div>
      </div>

      {/* Applications table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Loan Applications</h2>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Name", "Branch", "Loan range", "Sent", "Status"].map(h => (
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
              {apps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No applications in this period.
                  </td>
                </tr>
              ) : (
                apps.map(r => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-6 py-3.5 text-gray-900 font-medium">{r.name}</td>
                    <td className="px-6 py-3.5 text-gray-600">{r.branch}</td>
                    <td className="px-6 py-3.5 text-gray-700">{r.range}</td>
                    <td className="px-6 py-3.5 text-gray-600">{r.sent}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
          <div>
            Showing{" "}
            <span className="font-medium text-gray-700">
              {apps.length === 0 ? 0 : 1}-{apps.length}
            </span>{" "}
            of <span className="font-medium text-gray-700">{apps.length}</span>
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
      <DashboardQuickLinks />
    </div>
  );
}
