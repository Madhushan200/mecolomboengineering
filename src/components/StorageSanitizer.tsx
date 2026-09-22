"use client";

import { useEffect } from "react";

export function StorageSanitizer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Proactive cleanup of legacy bloated keys on mount
      const legacyBloatedKeys = [
        "simple_eng_work_orders_v4",
        "simple_eng_work_orders_v3",
        "simple_eng_work_orders_v2",
        "simple_eng_work_orders_v1",
        "simple_eng_work_orders",
        "dodoz_erp_costings",
        "dodoz_crm_vouchers"
      ];

      for (const k of legacyBloatedKeys) {
        try {
          if (window.localStorage.getItem(k) !== null) {
            window.localStorage.removeItem(k);
          }
        } catch {
          // ignore restricted storage errors
        }
      }
    } catch (e) {
      console.warn("[StorageSanitizer] Storage cleanup notice:", e);
    }
  }, []);

  return null;
}
