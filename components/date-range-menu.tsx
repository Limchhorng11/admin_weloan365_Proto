"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DATE_RANGES = [
  "This Week",
  "This Month",
  "This Quarter",
  "This Year",
  "All time",
] as const;

export type DateRange = (typeof DATE_RANGES)[number];

/**
 * Date-range selector. Can be used uncontrolled (manages its own value) or
 * controlled by passing `value` + `onChange` so a parent (e.g. the dashboard)
 * can react to the selection.
 */
export function DateRangeMenu({
  value: valueProp,
  onChange,
}: {
  value?: DateRange;
  onChange?: (value: DateRange) => void;
} = {}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<DateRange>("This Month");
  const value = valueProp ?? internal;
  const setValue = (v: DateRange) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span>{value}</span>
        <ChevronDown
          className={cn("w-3.5 h-3.5 text-gray-400 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden py-1"
        >
          {DATE_RANGES.map(r => {
            const on = r === value;
            return (
              <button
                key={r}
                role="menuitem"
                onClick={() => {
                  setValue(r);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left flex items-center justify-between px-3 py-1.5 text-sm",
                  on ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span>{r}</span>
                {on && <Check className="w-3.5 h-3.5 text-brand-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
