/**************************************************************************
 *  src/stores/dashboardTestStore.js
 *  – Zustand-хранилище: грузит «уникальные открытые» ТН + все поля
 **************************************************************************/

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ---------------- helpers ------------------------------------------ */

/** Грузит партии по 100 объектов. Если full=true — populate=* (берём всё). */
async function fetchTns({ token, statusValue = null, full = false }) {
  const pageSize = 100;
  let page = 1;
  const out = [];
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const populate = full
    ? "populate=*"
    : "populate[0]=VIOLATION_GUID_STR&populate[1]=STATUS_NAME";

  while (true) {
    const qs = [
      `pagination[page]=${page}`,
      `pagination[pageSize]=${pageSize}`,
      populate,
    ];
    if (statusValue) {
      qs.push(
        "filters[STATUS_NAME][value][$eqi]=" + encodeURIComponent(statusValue)
      );
    }

    const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?${qs.join("&")}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    out.push(...(json.data ?? []).map((d) => d.attributes ?? d));

    if (page >= (json.meta?.pagination?.pageCount ?? 1)) break;
    page += 1;
  }
  return out;
}

const getGuid = (item) =>
  (
    item?.VIOLATION_GUID_STR?.value ??
    (typeof item?.VIOLATION_GUID_STR === "string"
      ? item.VIOLATION_GUID_STR
      : null)
  )
    ?.trim()
    ?.toUpperCase() || null;

/* ---------------- store ------------------------------------------- */
export const useDashboardTestStore = create(
  persist(
    (set) => ({
      uniqueOpen: [],
      isLoading: false,
      error: null,

      async loadUnique(token) {
        try {
          set({ isLoading: true, error: null });

          // «открытые» — берём полностью (все поля)
          const openFull = await fetchTns({
            token,
            statusValue: "открыта",
            full: true,
          });

          // прочие статусы — достаточно GUID-ов
          const [powered, closed, all] = await Promise.all([
            fetchTns({ token, statusValue: "запитана" }),
            fetchTns({ token, statusValue: "закрыта" }),
            fetchTns({ token }),
          ]);

          const otherGuids = new Set([
            ...powered.map(getGuid).filter(Boolean),
            ...closed.map(getGuid).filter(Boolean),
            ...all
              .filter((i) => {
                const st = (i.STATUS_NAME?.value ?? i.STATUS_NAME ?? "")
                  .trim()
                  .toLowerCase();
                return !["открыта", "запитана", "закрыта"].includes(st);
              })
              .map(getGuid)
              .filter(Boolean),
          ]);

          /* dedup + attach guid */
          const map = new Map();
          openFull.forEach((rec) => {
            const g = getGuid(rec);
            if (g && !map.has(g)) map.set(g, { ...rec, guid: g });
          });

          const uniqueOpen = [...map.values()].filter(
            (rec) => !otherGuids.has(rec.guid)
          );

          set({ uniqueOpen, isLoading: false });
        } catch (e) {
          console.error("DashboardTestStore.loadUnique", e);
          set({
            error: e.message || "Ошибка загрузки данных",
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "dashboard-test-cache",
      partialize: (s) => ({ uniqueOpen: s.uniqueOpen }),
    }
  )
);
