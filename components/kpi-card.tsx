import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
};

export function KpiCard({ icon: Icon, label, value, delta, deltaTone = "up" }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
      <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[22px] font-semibold text-gray-900 tracking-tight">{value}</span>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium",
              deltaTone === "up" && "text-emerald-600",
              deltaTone === "down" && "text-red-500",
              deltaTone === "neutral" && "text-gray-500"
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
