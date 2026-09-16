"use client";

import { useEffect } from "react";

export function StorageSanitizer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // 1. Safe Proxy for localStorage.setItem to permanently prevent QuotaExceededError crashes
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      window.localStorage.setItem = function (key: string, value: string) {
        try {
          originalSetItem(key, value);
        } catch (err: any) {
          if (
            err?.name === "QuotaExceededError" ||
            err?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
            err?.code === 22 ||
            err?.code === 1014
          ) {
            console.warn(`[StorageSanitizer] LocalStorage quota exceeded while setting "${key}". Evicting legacy cache.`);
            // Evict legacy heavy keys
            try {
              const legacyKeys = [
                "simple_eng_work_orders_v4",
                "simple_eng_work_orders_v3",
                "simple_eng_work_orders_v2",
                "simple_eng_work_orders_v1",
                "simple_eng_work_orders",
                "dodoz_erp_costings",
                "dodoz_crm_vouchers"
              ];
              for (const lKey of legacyKeys) {
                window.localStorage.removeItem(lKey);
              }
              // Retry once after eviction
              originalSetItem(key, value);
            } catch (retryErr) {
              console.warn(`[StorageSanitizer] Failed to write key "${key}" even after eviction. Suppressing crash.`);
            }
          } else {
            console.error(`[StorageSanitizer] Error writing localStorage key "${key}":`, err);
          }
        }
      };

      // 2. Proactive cleanup of legacy bloated keys on mount
      const legacyBloatedKeys = [
        "simple_eng_work_orders_v4",
        "simple_eng_work_orders_v3",
        "simple_eng_work_orders_v2",
        "simple_eng_work_orders_v1",
        "simple_eng_work_orders"
      ];

      for (const k of legacyBloatedKeys) {
        if (window.localStorage.getItem(k) !== null) {
          console.info(`[StorageSanitizer] Removing obsolete bloated cache key: ${k}`);
          window.localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn("[StorageSanitizer] Error in storage initialization:", e);
    }
  }, []);

  return null;
}
