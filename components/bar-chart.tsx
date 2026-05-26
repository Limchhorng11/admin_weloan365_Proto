"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Datum = { label: string; value: number; highlight?: boolean };

type Props = {
  data: Datum[];
};

export function BarChart({ data }: Props) {
  const defaultIndex = data.findIndex(d => d.highlight);
  const [hover, setHover] = useState<number | null>(defaultIndex >= 0 ? defaultIndex : null);
  const [mounted, setMounted] = useState(false);

  // Trigger the candle-style entrance animation after mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
            className="absolute z-10 -translate-x-1/2 -translate-y-2 transition-all duration-700 ease-out"
            style={{
              left: `${((activeIndex + 0.5) / data.length) * 100}%`,
              top: mounted ? `${100 - (data[activeIndex].value / max) * 100}%` : "100%",
              opacity: mounted ? 1 : 0,
              transitionDelay: `${data.length * 60 + 200}ms`,
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
            const targetH = (d.value / max) * 100;
            const active = i === activeIndex;
            // Stagger left → right so it reads like a candle sequence rising.
            const delay = `${i * 60}ms`;
            return (
              <div
                key={i}
                className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Candle wick — short vertical tick that appears just before the bar settles */}
                <div
                  className={cn(
                    "w-px transition-all ease-out",
                    active ? "bg-brand-600/70" : "bg-gray-300/70"
                  )}
                  style={{
                    height: mounted ? "6px" : "0px",
                    opacity: mounted ? 1 : 0,
                    transitionDuration: "400ms",
                    transitionDelay: `calc(${delay} + 500ms)`,
                  }}
                />
                {/* Bar body */}
                <div
                  className={cn(
                    "w-full rounded-t transition-[height,background-color,transform] ease-out origin-bottom",
                    active ? "bg-brand-600" : "bg-gray-200 group-hover:bg-gray-300"
                  )}
                  style={{
                    height: mounted ? `${targetH}%` : "0%",
                    minHeight: mounted ? "4px" : "0px",
                    transitionDuration: "800ms",
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    transitionDelay: delay,
                  }}
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
