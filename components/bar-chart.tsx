"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Datum = { label: string; value: number; highlight?: boolean };

type Props = {
  data: Datum[];
};

export function BarChart({ data }: Props) {
  const defaultIndex = data.findIndex(d => d.highlight);
  const [hover, setHover] = useState<number | null>(defaultIndex >= 0 ? defaultIndex : null);

  const max = Math.max(...data.map(d => d.value));
  const ticks = [0, max * 0.33, max * 0.66, max];
  const activeIndex = hover ?? defaultIndex;

  return (
    <div className="relative pl-10 pr-2">
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full w-8 flex flex-col justify-between -translate-x-10 text-[11px] text-gray-400">
          {[...ticks].reverse().map((t, i) => (
            <div key={i}>${Math.round(t / 1000)}K</div>
          ))}
        </div>

        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {ticks.map((_, i) => (
            <div key={i} className="border-t border-dashed border-gray-100" />
          ))}
        </div>

        {/* Tooltip */}
        {activeIndex !== null && activeIndex >= 0 && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-2"
            style={{
              left: `${((activeIndex + 0.5) / data.length) * 100}%`,
              top: `${100 - (data[activeIndex].value / max) * 100}%`,
            }}
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs whitespace-nowrap -translate-y-full">
              <div className="text-gray-500 mb-0.5">Volume</div>
              <div className="font-semibold text-gray-900">
                ${data[activeIndex].value.toLocaleString()}.00
                <span className="ml-1 text-gray-400 text-[10px] font-normal">USD</span>
              </div>
            </div>
          </div>
        )}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-2">
          {data.map((d, i) => {
            const h = (d.value / max) * 100;
            const active = i === activeIndex;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-colors",
                    active ? "bg-brand-600" : "bg-gray-200 group-hover:bg-gray-300"
                  )}
                  style={{ height: `${h}%`, minHeight: "4px" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[11px] text-gray-400">{d.label}</div>
        ))}
      </div>
    </div>
  );
}
