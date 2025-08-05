"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ---------- helpers ---------- */

/** Скачивает все ТН указанного статуса (или всей базы) пакетом по 100. */
async function fetchTns({ token, statusValue = null }) {
  const pageSize = 100;
  let page = 1;
  const out = [];
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // всегда забираем GUID, номер ТН и статус
  const populate =
    "populate[0]=VIOLATION_GUID_STR&populate[1]=F81_010_NUMBER&populate[2]=STATUS_NAME";

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

    const { pageCount } = json.meta?.pagination ?? {};
    if (!pageCount || page >= pageCount) break;
    page += 1;
  }
  return out;
}

/** Извлекает GUID из записи (в едином формате). */
const getGuid = (item) =>
  (
    item?.VIOLATION_GUID_STR?.value ??
    (typeof item?.VIOLATION_GUID_STR === "string"
      ? item.VIOLATION_GUID_STR
      : null)
  )
    ?.trim()
    ?.toUpperCase() || null;

/* ---------- store ---------- */

export const useDashboardTestStore = create(
  persist(
    (set) => ({
      uniqueOpen: [], // массив объектов с полями guid, createdAt, F81_010_NUMBER, ...
      isLoading: false,
      error: null,

      /** Загружает и вычисляет «уникальные открытые» */
      async loadUnique(token) {
        try {
          set({ isLoading: true, error: null });

          // данные разных статусов
          const [openFull, powered, closed, all] = await Promise.all([
            fetchTns({ token, statusValue: "открыта" }),
            fetchTns({ token, statusValue: "запитана" }),
            fetchTns({ token, statusValue: "закрыта" }),
            fetchTns({ token }), // для «без статуса»
          ]);

          // GUID-ы, встречающиеся где-угодно, кроме «открытых»
          const otherGuids = new Set([
            ...powered.map(getGuid).filter(Boolean),
            ...closed.map(getGuid).filter(Boolean),
            ...all
              .filter((i) => {
                const s = (i.STATUS_NAME?.value ?? i.STATUS_NAME ?? "")
                  .trim()
                  .toLowerCase();
                return !["открыта", "запитана", "закрыта"].includes(s);
              })
              .map(getGuid)
              .filter(Boolean),
          ]);

          // убираем дубликаты среди «открытых» + кладём сам GUID внутрь объекта
          const map = new Map();
          openFull.forEach((rec) => {
            const g = getGuid(rec);
            if (g && !map.has(g)) {
              map.set(g, { ...rec, guid: g });
            }
          });

          // финальный список
          const uniqueOpenArr = [...map.values()].filter(
            (rec) => !otherGuids.has(rec.guid)
          );

          set({ uniqueOpen: uniqueOpenArr, isLoading: false });
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
      partialize: (state) => ({ uniqueOpen: state.uniqueOpen }), // кэшируем только результаты
    }
  )
);
