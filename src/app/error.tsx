"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error Caught by Next.js Error Boundary:", error);

    // If quota error, proactively clean up localStorage
    if (
      error.message?.includes("QuotaExceededError") ||
      error.name === "QuotaExceededError" ||
      error.message?.includes("quota")
    ) {
      try {
        localStorage.removeItem("simple_eng_work_orders_v4");
        localStorage.removeItem("simple_eng_work_orders_v3");
        localStorage.removeItem("simple_eng_work_orders_v2");
        localStorage.removeItem("simple_eng_work_orders_v1");
        localStorage.removeItem("simple_eng_work_orders");
      } catch (e) {
        // ignore
      }
    }
  }, [error]);

  const handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-navy-950 font-display">
            System Workspace Notice
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error.message?.includes("QuotaExceededError")
              ? "Browser storage quota was exceeded by legacy cached items. We have resolved the storage and you can reload."
              : error.message || "An unexpected error occurred while loading the workspace."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            type="button"
            onClick={handleClearAndReload}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Cache & Reload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
