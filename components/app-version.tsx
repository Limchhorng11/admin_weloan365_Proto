"use client";

import { useState } from "react";
import { CheckCircle2, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Demo state — set CURRENT_VERSION equal to LATEST_VERSION for the "up to date" view.
export const CURRENT_VERSION: string = "0.2.0";
export const LATEST_VERSION: string  = "0.3.1";

/**
 * Update panel rendered inside the Settings modal's "App Setting" view.
 * No own border or background so it inherits the surrounding card styling.
 */
export function AppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(CURRENT_VERSION !== LATEST_VERSION);
  const [updating, setUpdating] = useState(false);

  const startUpdate = () => {
    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      setUpdateAvailable(false);
    }, 1500);
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">Current version</span>
        <span className="font-medium text-gray-900">v{CURRENT_VERSION}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Latest version</span>
        <span className="font-medium text-gray-900">v{LATEST_VERSION}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Release channel</span>
        <span className="font-medium text-gray-900">Stable</span>
      </div>

      <div className="pt-3 border-t border-gray-100">
        {updateAvailable ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900">Please alert customer to update the mobile app</div>
                <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                  v{CURRENT_VERSION} → <span className="font-medium">v{LATEST_VERSION}</span> · Bug fixes and performance improvements
                </div>
              </div>
              <button
                onClick={startUpdate}
                disabled={updating}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium whitespace-nowrap",
                  updating
                    ? "bg-amber-200 text-amber-800 cursor-wait"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                )}
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Alert now
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900">You&apos;re up to date</div>
                <div className="text-[11px] text-gray-600 mt-0.5">
                  Running the latest version of WeLoan365 Admin.
                </div>
              </div>
              <button
                onClick={() => setUpdateAvailable(true)}
                className="px-3 py-1.5 text-xs rounded-md font-medium border border-gray-200 text-gray-700 hover:bg-white"
              >
                Check again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
