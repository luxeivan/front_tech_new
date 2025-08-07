"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export const useDashboardTestStore = create(
  persist(
    (set, get) => ({
      uniqueOpen: [],
      isLoading: false,
      error: null,
      newGuids: [],

      // Обработка SSE-события: добавляем новый открытый ТН без полной перезагрузки
      handleEvent: (payload) => {
        try {
          // работаем только с ТН
          if (payload.uid !== "api::tn.tn") return;
          // интересуют только создание и публикация
          if (!["entry.create", "entry.publish"].includes(payload.event)) return;
          const entry = payload.entry;
          // получаем GUID
          const g = (
            entry.VIOLATION_GUID_STR?.value ??
            entry.VIOLATION_GUID_STR
          )?.trim()?.toUpperCase();
          if (!g) return;
          set((state) => {
            // если ТН уже есть, ничего не делаем
            if (state.uniqueOpen.some((r) => r.guid === g)) return {};
            // добавляем новый ТН
            const rec = { ...entry, guid: g };
            return {
              uniqueOpen: [rec, ...state.uniqueOpen],
              newGuids: [...state.newGuids, g],
            };
          });
          // звук и очистка подсветки
          new Audio("/sounds/sound.mp3").play().catch(() => {});
          setTimeout(() => set({ newGuids: [] }), 30000);
        } catch (e) {
          console.error("DashboardTestStore.handleEvent", e);
        }
      },

      // Полная загрузка уникальных открытых ТН
      async loadUnique(token) {
        try {
          set({ isLoading: true, error: null });

          // «открытые» — берём полностью
          const openFull = await fetchTns({
            token,
            statusValue: "открыта",
            full: true,
          });

          // остальные статусы — только GUID
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

          // dedup + attach guid
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
      partialize: (state) => ({ uniqueOpen: state.uniqueOpen }),
    }
  )
);
