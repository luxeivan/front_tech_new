"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORE_VERSION = 2;
const CACHE_TTL_MS = 60 * 1000; // 60 c

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

const getGuid = (item) => {
  const raw =
    item?.VIOLATION_GUID_STR?.value ??
    (typeof item?.VIOLATION_GUID_STR === "string"
      ? item.VIOLATION_GUID_STR
      : null);
  if (raw == null) return null;
  return String(raw).trim().toUpperCase() || null;
};

export const useDashboardTestStore = create(
  persist(
    (set, get) => ({
      uniqueOpen: [],
      isLoading: false,
      error: null,
      newGuids: [],
      lastSyncAt: 0,

      // звук: управление и «разблокировка» браузера
      soundEnabled: false,
      audioUnlocked: false,
      audioEl: null,
      audioCtx: null,

      enableSound: () => {
        try {
          // 1) пробуем подготовить <audio>
          const el = new Audio("/sounds/sound.mp3");
          el.preload = "auto";
          el.volume = 1;
          // Вызов из клика — должен пройти без блокировок
          el.play()
            .then(() => {
              el.pause();
              el.currentTime = 0;
              set({
                soundEnabled: true,
                audioUnlocked: true,
                audioEl: el,
              });
            })
            .catch(async () => {
              // 2) запасной вариант — WebAudio beep
              const Ctx =
                window.AudioContext || window.webkitAudioContext || null;
              if (Ctx) {
                const ctx = new Ctx();
                await ctx.resume().catch(() => {});
                set({
                  soundEnabled: true,
                  audioUnlocked: true,
                  audioCtx: ctx,
                  audioEl: null,
                });
              } else {
                set({ soundEnabled: true, audioUnlocked: true });
              }
            });
        } catch {
          set({ soundEnabled: true, audioUnlocked: true });
        }
      },

      disableSound: () => {
        const { audioEl, audioCtx } = get();
        try {
          audioEl?.pause?.();
        } catch {}
        try {
          audioCtx?.close?.();
        } catch {}
        set({
          soundEnabled: false,
          audioUnlocked: false,
          audioEl: null,
          audioCtx: null,
        });
      },

      _ping: () => {
        const { soundEnabled, audioUnlocked, audioEl, audioCtx } = get();
        if (!soundEnabled || !audioUnlocked) return;

        // пробуем mp3
        if (audioEl) {
          try {
            audioEl.currentTime = 0;
            audioEl.play().catch(() => {});
            return;
          } catch {}
        }
        // запасной бип
        if (audioCtx) {
          try {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = "sine";
            o.frequency.value = 880;
            g.gain.value = 0.06;
            o.connect(g).connect(audioCtx.destination);
            o.start();
            setTimeout(() => {
              try {
                o.stop();
              } catch {}
            }, 220);
          } catch {}
        }
      },

      // лайв-событие из Strapi
      handleEvent: (payload) => {
        try {
          if (payload?.uid !== "api::tn.tn") return;

          const entry = payload.entry || {};
          const status = (entry.STATUS_NAME?.value ?? entry.STATUS_NAME ?? "")
            .toString()
            .trim()
            .toLowerCase();

          // интересуют только "открыта"
          if (status && status !== "открыта") return;

          const g = getGuid(entry);
          if (!g) return;

          set((state) => {
            const idx = state.uniqueOpen.findIndex((r) => r.guid === g);
            const now = Date.now();

            if (idx >= 0) {
              const merged = { ...state.uniqueOpen[idx], ...entry, guid: g };
              const rest = [...state.uniqueOpen];
              rest.splice(idx, 1);
              const nextNewGuids = state.newGuids.includes(g)
                ? state.newGuids
                : [...state.newGuids, g];
              return {
                uniqueOpen: [merged, ...rest],
                newGuids: nextNewGuids,
                lastSyncAt: now,
              };
            }
            return {
              uniqueOpen: [{ ...entry, guid: g }, ...state.uniqueOpen],
              newGuids: [...state.newGuids, g],
              lastSyncAt: now,
            };
          });

          // звук и очистка подсветки
          get()._ping();
          setTimeout(() => set({ newGuids: [] }), 30000);
        } catch (e) {
          console.error("DashboardTestStore.handleEvent", e);
        }
      },

      async loadUnique(token) {
        try {
          set({ isLoading: true, error: null });

          const openFull = await fetchTns({
            token,
            statusValue: "открыта",
            full: true,
          });

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
                  .toString()
                  .trim()
                  .toLowerCase();
                return !["открыта", "запитана", "закрыта"].includes(st);
              })
              .map(getGuid)
              .filter(Boolean),
          ]);

          const map = new Map();
          openFull.forEach((rec) => {
            const g = getGuid(rec);
            if (g && !map.has(g)) map.set(g, { ...rec, guid: g });
          });

          const uniqueOpen = [...map.values()].filter(
            (rec) => !otherGuids.has(rec.guid)
          );

          set({ uniqueOpen, isLoading: false, lastSyncAt: Date.now() });
        } catch (e) {
          console.error("DashboardTestStore.loadUnique", e);
          set({
            error: e.message || "Ошибка загрузки данных",
            isLoading: false,
          });
        }
      },

      isCacheExpired: () => Date.now() - get().lastSyncAt > CACHE_TTL_MS,
    }),
    {
      name: "dashboard-test-cache",
      version: STORE_VERSION,
      migrate: (persistedState, version) => {
        if (!persistedState || version < STORE_VERSION) {
          return { uniqueOpen: [], lastSyncAt: 0, soundEnabled: false };
        }
        return persistedState;
      },
      // хотим помнить только эти поля
      partialize: (state) => ({
        uniqueOpen: state.uniqueOpen,
        lastSyncAt: state.lastSyncAt,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

// "use client";

// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// async function fetchTns({ token, statusValue = null, full = false }) {
//   const pageSize = 100;
//   let page = 1;
//   const out = [];
//   const headers = token ? { Authorization: `Bearer ${token}` } : {};

//   const populate = full
//     ? "populate=*"
//     : "populate[0]=VIOLATION_GUID_STR&populate[1]=STATUS_NAME";

//   while (true) {
//     const qs = [
//       `pagination[page]=${page}`,
//       `pagination[pageSize]=${pageSize}`,
//       populate,
//     ];
//     if (statusValue) {
//       qs.push(
//         "filters[STATUS_NAME][value][$eqi]=" + encodeURIComponent(statusValue)
//       );
//     }

//     const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?${qs.join("&")}`;
//     const res = await fetch(url, { headers });
//     if (!res.ok) throw new Error(`HTTP ${res.status}`);

//     const json = await res.json();
//     out.push(...(json.data ?? []).map((d) => d.attributes ?? d));

//     if (page >= (json.meta?.pagination?.pageCount ?? 1)) break;
//     page += 1;
//   }
//   return out;
// }

// const getGuid = (item) =>
//   (
//     item?.VIOLATION_GUID_STR?.value ??
//     (typeof item?.VIOLATION_GUID_STR === "string"
//       ? item.VIOLATION_GUID_STR
//       : null)
//   )
//     ?.trim()
//     ?.toUpperCase() || null;

// export const useDashboardTestStore = create(
//   persist(
//     (set, get) => ({
//       uniqueOpen: [],
//       isLoading: false,
//       error: null,
//       newGuids: [],

//       // Обработка SSE-события: добавляем новый открытый ТН без полной перезагрузки
//       handleEvent: (payload) => {
//         try {
//           // работаем только с ТН
//           if (payload.uid !== "api::tn.tn") return;
//           // интересуют только создание и публикация
//           if (!["entry.create", "entry.publish"].includes(payload.event)) return;
//           const entry = payload.entry;
//           // получаем GUID
//           const g = (
//             entry.VIOLATION_GUID_STR?.value ??
//             entry.VIOLATION_GUID_STR
//           )?.trim()?.toUpperCase();
//           if (!g) return;
//           set((state) => {
//             // если ТН уже есть, ничего не делаем
//             if (state.uniqueOpen.some((r) => r.guid === g)) return {};
//             // добавляем новый ТН
//             const rec = { ...entry, guid: g };
//             return {
//               uniqueOpen: [rec, ...state.uniqueOpen],
//               newGuids: [...state.newGuids, g],
//             };
//           });
//           // звук и очистка подсветки
//           new Audio("/sounds/sound.mp3").play().catch(() => {});
//           setTimeout(() => set({ newGuids: [] }), 30000);
//         } catch (e) {
//           console.error("DashboardTestStore.handleEvent", e);
//         }
//       },

//       // Полная загрузка уникальных открытых ТН
//       async loadUnique(token) {
//         try {
//           set({ isLoading: true, error: null });

//           // «открытые» — берём полностью
//           const openFull = await fetchTns({
//             token,
//             statusValue: "открыта",
//             full: true,
//           });

//           // остальные статусы — только GUID
//           const [powered, closed, all] = await Promise.all([
//             fetchTns({ token, statusValue: "запитана" }),
//             fetchTns({ token, statusValue: "закрыта" }),
//             fetchTns({ token }),
//           ]);

//           const otherGuids = new Set([
//             ...powered.map(getGuid).filter(Boolean),
//             ...closed.map(getGuid).filter(Boolean),
//             ...all
//               .filter((i) => {
//                 const st = (i.STATUS_NAME?.value ?? i.STATUS_NAME ?? "")
//                   .trim()
//                   .toLowerCase();
//                 return !["открыта", "запитана", "закрыта"].includes(st);
//               })
//               .map(getGuid)
//               .filter(Boolean),
//           ]);

//           // dedup + attach guid
//           const map = new Map();
//           openFull.forEach((rec) => {
//             const g = getGuid(rec);
//             if (g && !map.has(g)) map.set(g, { ...rec, guid: g });
//           });

//           const uniqueOpen = [...map.values()].filter(
//             (rec) => !otherGuids.has(rec.guid)
//           );
//           set({ uniqueOpen, isLoading: false });
//         } catch (e) {
//           console.error("DashboardTestStore.loadUnique", e);
//           set({
//             error: e.message || "Ошибка загрузки данных",
//             isLoading: false,
//           });
//         }
//       },
//     }),
//     {
//       name: "dashboard-test-cache",
//       partialize: (state) => ({ uniqueOpen: state.uniqueOpen }),
//     }
//   )
// );
