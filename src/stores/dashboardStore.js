/* ------------------------------------------------------------------
 * src/stores/dashboardStore.js
 * Пересобран под “уникальные открытые” — API совместим с прежними
 * (applyFilter, outages, metrics, stats   ⇒   ничего не ломается)
 * ----------------------------------------------------------------*/

import {
  ThunderboltOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ToolOutlined,
  ApartmentOutlined,
  BankOutlined,
  ShopOutlined,
  FireOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  BuildOutlined,
  MedicineBoxOutlined,
  ReadOutlined,
  SmileOutlined,
} from "@ant-design/icons";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* -------- helpers: загрузка из Strapi --------------------------------- */

/** тянем ТН с заданным статусом; если needFull, тащим populate=* */
async function fetchTns({ token, statusValue, needFull = false }) {
  const pageSize = 100;
  let page = 1;
  const out = [];
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const populate = needFull ? "populate=*" : "populate[0]=VIOLATION_GUID_STR";

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

    out.push(...(json.data ?? []).map((i) => i.attributes ?? i));

    const { pageCount } = json.meta?.pagination ?? {};
    if (!pageCount || page >= pageCount) break;
    page += 1;
  }
  return out;
}

function getGuid(item) {
  const g =
    item?.VIOLATION_GUID_STR?.value ??
    (typeof item?.VIOLATION_GUID_STR === "string"
      ? item.VIOLATION_GUID_STR
      : null);
  return g?.trim() || null;
}

/* -------- zustand store ------------------------------------------------ */

export const useDashboardStore = create(
  persist(
    (set, get) => ({
      /* ---- state ---- */
      outages: 0,
      metrics: [],
      stats: [],
      uniqueOpen: [], // full записи уникальных «открыта»
      filterField: null,
      minValue: null,
      filteredTns: [], // уникальные, прошедшие applyFilter
      fiasCache: {},

      isLoaded: false,
      loadError: null,

      /* -------------------------------------------------- */
      /** пересчитать карточки по current filteredTns */
      _recalcAggregates() {
        const tns = get().filteredTns;

        const metrics = [
          {
            icon: <ThunderboltOutlined />,
            title: "Отключено ТП",
            value: tns.reduce((s, i) => s + (Number(i.TP_ALL?.value) || 0), 0),
            color: "#faad14",
            filterField: "TP_ALL",
          },
          {
            icon: <EnvironmentOutlined />,
            title: "Отключено ЛЭП 6-20 кВ",
            value: tns.reduce(
              (s, i) => s + (Number(i.LINESN_ALL?.value) || 0),
              0
            ),
            color: "#52c41a",
            filterField: "LINESN_ALL",
          },
          {
            icon: <HomeOutlined />,
            title: "Населённых пунктов",
            value: new Set(
              tns
                .map((i) =>
                  typeof i.DISTRICT === "object"
                    ? i.DISTRICT?.value
                    : i.DISTRICT
                )
                .filter(Boolean)
            ).size,
            color: "#1890ff",
            filterField: "DISTRICT",
          },
          {
            icon: <TeamOutlined />,
            title: "Население",
            value: tns.reduce(
              (s, i) => s + (Number(i.POPULATION_COUNT?.value) || 0),
              0
            ),
            color: "#722ed1",
            filterField: "POPULATION_COUNT",
          },
          {
            icon: <ApartmentOutlined />,
            title: "МКД",
            value: tns.reduce((s, i) => s + (Number(i.MKD_ALL?.value) || 0), 0),
            color: "#fa541c",
            filterField: "MKD_ALL",
          },
          {
            icon: <BankOutlined />,
            title: "Частные дома",
            value: tns.reduce(
              (s, i) => s + (Number(i.PRIVATE_HOUSE_ALL?.value) || 0),
              0
            ),
            color: "#fa8c16",
            filterField: "PRIVATE_HOUSE_ALL",
          },
          {
            icon: <ShopOutlined />,
            title: "СНТ",
            value: tns.reduce((s, i) => s + (Number(i.SNT_ALL?.value) || 0), 0),
            color: "#52c41a",
            filterField: "SNT_ALL",
          },
          {
            icon: <FireOutlined />,
            title: "Котельных",
            value: tns.reduce(
              (s, i) => s + (Number(i.BOILER_ALL?.value) || 0),
              0
            ),
            color: "#eb2f96",
            filterField: "BOILER_ALL",
          },
          {
            icon: <DashboardOutlined />,
            title: "ЦТП",
            value: tns.reduce((s, i) => s + (Number(i.CTP_ALL?.value) || 0), 0),
            color: "#13c2c2",
            filterField: "CTP_ALL",
          },
          {
            icon: <ExperimentOutlined />,
            title: "ВЗУ",
            value: tns.reduce(
              (s, i) => s + (Number(i.WELLS_ALL?.value) || 0),
              0
            ),
            color: "#722ed1",
            filterField: "WELLS_ALL",
          },
          {
            icon: <BuildOutlined />,
            title: "КНС",
            value: tns.reduce((s, i) => s + (Number(i.KNS_ALL?.value) || 0), 0),
            color: "#faad14",
            filterField: "KNS_ALL",
          },
          {
            icon: <MedicineBoxOutlined />,
            title: "Больниц",
            value: tns.reduce(
              (s, i) => s + (Number(i.HOSPITALS_ALL?.value) || 0),
              0
            ),
            color: "#1890ff",
            filterField: "HOSPITALS_ALL",
          },
          {
            icon: <MedicineBoxOutlined />,
            title: "Поликлиник",
            value: tns.reduce(
              (s, i) => s + (Number(i.CLINICS_ALL?.value) || 0),
              0
            ),
            color: "#722ed1",
            filterField: "CLINICS_ALL",
          },
          {
            icon: <ReadOutlined />,
            title: "Школ",
            value: tns.reduce(
              (s, i) => s + (Number(i.SCHOOLS_ALL?.value) || 0),
              0
            ),
            color: "#52c41a",
            filterField: "SCHOOLS_ALL",
          },
          {
            icon: <SmileOutlined />,
            title: "Детских садов",
            value: tns.reduce(
              (s, i) => s + (Number(i.KINDERGARTENS_ALL?.value) || 0),
              0
            ),
            color: "#fa541c",
            filterField: "KINDERGARTENS_ALL",
          },
        ];

        const stats = [
          {
            icon: <TeamOutlined />,
            title: "Бригады",
            value: tns.reduce(
              (s, i) => s + (Number(i.BRIGADECOUNT?.value) || 0),
              0
            ),
            color: "#722ed1",
          },
          {
            icon: <UserOutlined />,
            title: "Люди",
            value: tns.reduce(
              (s, i) => s + (Number(i.EMPLOYEECOUNT?.value) || 0),
              0
            ),
            color: "#13c2c2",
          },
          {
            icon: <ToolOutlined />,
            title: "Техника",
            value: tns.reduce(
              (s, i) => s + (Number(i.SPECIALTECHNIQUECOUNT?.value) || 0),
              0
            ),
            color: "#eb2f96",
          },
          {
            icon: <ThunderboltOutlined />,
            title: "ПЭС",
            value: tns.reduce(
              (s, i) => s + (Number(i.PES_COUNT?.value) || 0),
              0
            ),
            color: "#faad14",
          },
        ];

        set({ outages: tns.length, metrics, stats });
      },

      /* -------------------------------------------------- */
      /** PUBLIC: загрузить уникальные «открытые» и пересчитать всё */
      async loadUniqueOpen(token) {
        try {
          set({ isLoaded: false, loadError: null });

          // ―― получаем полные открытые ТН ――
          const openTns = await fetchTns({
            token,
            statusValue: "открыта",
            needFull: true,
          });

          // ―― получаем GUID-ы других статусов/остального ――
          const [powered, closed, othersAll] = await Promise.all([
            fetchTns({ token, statusValue: "запитана" }),
            fetchTns({ token, statusValue: "закрыта" }),
            fetchTns({ token }), // вся база
          ]);

          const otherGuids = new Set([
            ...powered.map(getGuid).filter(Boolean),
            ...closed.map(getGuid).filter(Boolean),
            ...othersAll
              .filter(
                (i) => (i.STATUS_NAME?.value ?? i.STATUS_NAME) !== "открыта" // не открыта
              )
              .map(getGuid)
              .filter(Boolean),
          ]);

          // ―― фильтруем уникальные «открытые» ――
          const uniqueOpen = openTns.filter(
            (tn) => !otherGuids.has(getGuid(tn))
          );

          // by default всё — unfiltered
          set({
            uniqueOpen,
            filteredTns: uniqueOpen,
            filterField: null,
            minValue: null,
            isLoaded: true,
          });
          get()._recalcAggregates();
        } catch (e) {
          console.error("loadUniqueOpen", e);
          set({ loadError: e.message || "Ошибка", isLoaded: true });
        }
      },

      /* -------------------------------------------------- */
      /** PUBLIC: applyFilter — оставлено для совместимости */
      applyFilter(field = null, min = null) {
        const base = get().uniqueOpen || [];
        let filtered = base;

        if (field) {
          if (field === "DISTRICT") {
            filtered = base.filter((i) => {
              const v =
                typeof i.DISTRICT === "string"
                  ? i.DISTRICT
                  : i.DISTRICT?.value || "";
              return !!v && v.trim() !== "" && v.trim() !== "—";
            });
          } else if (min !== null && !isNaN(min)) {
            filtered = base.filter((i) => {
              const val = i[field]?.value;
              const n = Number(val);
              return !isNaN(n) && n >= min;
            });
          }
        }

        set({ filterField: field, minValue: min, filteredTns: filtered });
        get()._recalcAggregates();
      },

      /* ---------- coords / DaData (оставлено “как было”) ---------- */
      async loadCoordsFromTns() {
        /* временно офф */
        return;
      },
    }),
    {
      name: "dashboard-cache",
      partialize: (s) => ({ fiasCache: s.fiasCache }),
    }
  )
);
