
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

/**
 * Pure Zustand store for dashboard state.
 * Stores filter, fias cache, coords, and aggregates.
 */
export const useDashboardStore = create((set, get) => ({
  // --- UI filters ---
  filterField: null,
  minValue: null,

  // --- Dashboard data ---
  filteredTns: [],
  outages: 0,
  metrics: [],
  stats: [],

  // --- Map coordinates ---
  tnCoords: [],

  // --- DaData cache ---
  fiasCache: {},

  /* ---------- helpers ---------- */
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
        value: tns.reduce((s, i) => s + (Number(i.LINESN_ALL?.value) || 0), 0),
        color: "#52c41a",
        filterField: "LINESN_ALL",
      },
      {
        icon: <HomeOutlined />,
        title: "Населённых пунктов",
        value: new Set(tns.map((i) => i.DISTRICT?.value).filter(Boolean)).size,
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
        value: tns.reduce((s, i) => s + (Number(i.BOILER_ALL?.value) || 0), 0),
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
        value: tns.reduce((s, i) => s + (Number(i.WELLS_ALL?.value) || 0), 0),
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
        value: tns.reduce((s, i) => s + (Number(i.HOSPITALS_ALL?.value) || 0), 0),
        color: "#1890ff",
        filterField: "HOSPITALS_ALL",
      },
      {
        icon: <MedicineBoxOutlined />,
        title: "Поликлиник",
        value: tns.reduce((s, i) => s + (Number(i.CLINICS_ALL?.value) || 0), 0),
        color: "#722ed1",
        filterField: "CLINICS_ALL",
      },
      {
        icon: <ReadOutlined />,
        title: "Школ",
        value: tns.reduce((s, i) => s + (Number(i.SCHOOLS_ALL?.value) || 0), 0),
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
        value: tns.reduce((s, i) => s + (Number(i.BRIGADECOUNT?.value) || 0), 0),
        color: "#722ed1",
      },
      {
        icon: <UserOutlined />,
        title: "Люди",
        value: tns.reduce((s, i) => s + (Number(i.EMPLOYEECOUNT?.value) || 0), 0),
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
        value: tns.reduce((s, i) => s + (Number(i.PES_COUNT?.value) || 0), 0),
        color: "#faad14",
      },
    ];

    set({ outages: tns.length, metrics, stats });
  },

  applyFilter(field = null, min = null, allTns = []) {
    let filtered = allTns;

    if (field) {
      if (field === "DISTRICT") {
        filtered = allTns.filter((i) => {
          const v =
            typeof i.DISTRICT === "string" ? i.DISTRICT : i.DISTRICT?.value || "";
          return !!v && v.trim() !== "" && v.trim() !== "—";
        });
      } else if (min !== null && !isNaN(min)) {
        filtered = allTns.filter((i) => {
          const v = i[field]?.value;
          const n = Number(v);
          return !isNaN(n) && n >= min;
        });
      }
    }

    set({ filterField: field, minValue: min, filteredTns: filtered });
    get()._recalcAggregates();
  },

  /* ---------- coords / DaData ---------- */
  async loadCoordsFromTns(tns) {
    if (!Array.isArray(tns) || !tns.length) return;

    const allFias = [];
    tns.forEach((item) => {
      let arr = [];
      if (
        item.FIAS_LIST &&
        typeof item.FIAS_LIST === "object" &&
        typeof item.FIAS_LIST.value === "string"
      ) {
        arr = item.FIAS_LIST.value.split(";").map((s) => s.trim()).filter(Boolean);
      } else if (typeof item.FIAS_LIST === "string" && item.FIAS_LIST.trim()) {
        arr = item.FIAS_LIST.split(";").map((s) => s.trim()).filter(Boolean);
      }
      arr.forEach((f) => {
        if (f && !allFias.includes(f)) allFias.push(f);
      });
    });

    const cache = { ...get().fiasCache };
    const chunk = 5;
    for (let i = 0; i < allFias.length; i += chunk) {
      await Promise.all(
        allFias.slice(i, i + chunk).map(async (fias) => {
          if (cache[fias]) return;
          try {
            const resp = await fetch(
              `/api/dadata?query=${encodeURIComponent(fias)}&mode=findById`
            );
            if (!resp.ok) return;
            const j = await resp.json();
            const s =
              Array.isArray(j) ? j[0] : Array.isArray(j?.suggestions) ? j.suggestions[0] : null;
            if (!s) return;
            cache[fias] = {
              addr: s.unrestricted_value || s.value || null,
              lat: s.data?.geo_lat || s.geo_lat || null,
              lon: s.data?.geo_lon || s.geo_lon || null,
            };
          } catch {}
        })
      );
    }

    const coords = [];
    tns.forEach((item, idx) => {
      let arr = [];
      if (
        item.FIAS_LIST &&
        typeof item.FIAS_LIST === "object" &&
        typeof item.FIAS_LIST.value === "string"
      ) {
        arr = item.FIAS_LIST.value.split(";").map((s) => s.trim()).filter(Boolean);
      } else if (typeof item.FIAS_LIST === "string" && item.FIAS_LIST.trim()) {
        arr = item.FIAS_LIST.split(";").map((s) => s.trim()).filter(Boolean);
      }
      arr.forEach((f) => {
        const c = cache[f];
        if (c && c.lat && c.lon) {
          coords.push({
            id: `${idx}_${f}`,
            coords: [Number(c.lat), Number(c.lon)],
            label: item.NAME?.value || "",
            balloonContent: c.addr,
          });
        }
      });
    });

    set({ tnCoords: coords, fiasCache: cache });
  },
}));
