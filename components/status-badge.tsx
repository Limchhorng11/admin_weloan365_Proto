import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  Signed:                 "bg-emerald-50 text-emerald-700",
  "Waiting for Signature":"bg-amber-50 text-amber-700",
  Approved:               "bg-emerald-50 text-emerald-700",
  Disbursed:              "bg-violet-50 text-violet-700",
  Pending:                "bg-amber-50 text-amber-700",
  Review:                 "bg-sky-50 text-sky-700",
  Rejected:               "bg-red-50 text-red-700",
  Active:                 "bg-emerald-50 text-emerald-700",
  Inactive:               "bg-gray-100 text-gray-600",
  Published:              "bg-emerald-50 text-emerald-700",
  Draft:                  "bg-gray-100 text-gray-600",
  Scheduled:              "bg-sky-50 text-sky-700",
  Verified:               "bg-emerald-50 text-emerald-700",
  Failed:                 "bg-red-50 text-red-700",
  Open:                   "bg-amber-50 text-amber-700",
  Closed:                 "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cls = TONES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium", cls, className)}>
      {status}
    </span>
  );
}
