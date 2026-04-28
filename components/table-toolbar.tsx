"use client";

import { Search, SlidersHorizontal, ChevronDown, Plus } from "lucide-react";
import { ReactNode } from "react";

export function TableToolbar({
  title,
  action,
  onActionClick,
  children,
}: {
  title?: string;
  action?: string;
  onActionClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      {title ? <h2 className="text-base font-semibold text-gray-900">{title}</h2> : <div />}
      <div className="flex items-center gap-2">
        {children}
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
        {action && (
          <button
            onClick={onActionClick}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>{action}</span>
          </button>
        )}
      </div>
    </div>
  );
}
