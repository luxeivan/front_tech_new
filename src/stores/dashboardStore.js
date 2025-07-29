"use client";
import {
  ThunderboltOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ToolOutlined,
  EnvironmentOutlined,
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


export const useDashboardStore = create((set, get) => ({
  // --- UI‑фильтры ---
  filterField: null,
  minValue: null,
  // --- Данные дашборда ---
  filteredTns: [],
  outages: 0,
  metrics: [],
  stats: [],

  /**
   * Пересчитать агрегаты (outages, metrics, stats) по filteredTns.
   */
  _recalcAggregates() {
    const tns = get().filteredTns;

    const outages = tns.length;

    const metrics = [
      {
        icon: <ThunderboltOutlined />,
        title: "Отключено ТП",
        value: tns.reduce((sum, i) => sum + (Number(i.TP_ALL?.value) || 0), 0),
        color: "#faad14",
        filterField: "TP_ALL",
      },
      {
        icon: <EnvironmentOutlined />,
        title: "Отключено ЛЭП 6-20 кВ (шт.)",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.LINESN_ALL?.value) || 0),
          0
        ),
        color: "#52c41a",
        filterField: "LINESN_ALL",
      },
      {
        icon: <HomeOutlined />,
        title: "Населённых пунктов",
        value: new Set(
          tns.map((i) => i.DISTRICT?.value).filter(Boolean)
        ).size,
        color: "#1890ff",
        filterField: "DISTRICT",
      },
      {
        icon: <TeamOutlined />,
        title: "Население",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.POPULATION_COUNT?.value) || 0),
          0
        ),
        color: "#722ed1",
        filterField: "POPULATION_COUNT",
      },
      {
        icon: <ApartmentOutlined />,
        title: "МКД",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.MKD_ALL?.value) || 0),
          0
        ),
        color: "#fa541c",
        filterField: "MKD_ALL",
      },
      {
        icon: <BankOutlined />,
        title: "Частные дома",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.PRIVATE_HOUSE_ALL?.value) || 0),
          0
        ),
        color: "#fa8c16",
        filterField: "PRIVATE_HOUSE_ALL",
      },
      {
        icon: <ShopOutlined />,
        title: "СНТ",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.SNT_ALL?.value) || 0),
          0
        ),
        color: "#52c41a",
        filterField: "SNT_ALL",
      },
      {
        icon: <FireOutlined />,
        title: "Котельных",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.BOILER_ALL?.value) || 0),
          0
        ),
        color: "#eb2f96",
        filterField: "BOILER_ALL",
      },
      {
        icon: <DashboardOutlined />,
        title: "ЦТП",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.CTP_ALL?.value) || 0),
          0
        ),
        color: "#13c2c2",
        filterField: "CTP_ALL",
      },
      {
        icon: <ExperimentOutlined />,
        title: "ВЗУ",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.WELLS_ALL?.value) || 0),
          0
        ),
        color: "#722ed1",
        filterField: "WELLS_ALL",
      },
      {
        icon: <BuildOutlined />,
        title: "КНС",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.KNS_ALL?.value) || 0),
          0
        ),
        color: "#faad14",
        filterField: "KNS_ALL",
      },
      {
        icon: <MedicineBoxOutlined />,
        title: "Больниц",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.HOSPITALS_ALL?.value) || 0),
          0
        ),
        color: "#1890ff",
        filterField: "HOSPITALS_ALL",
      },
      {
        icon: <MedicineBoxOutlined />,
        title: "Поликлиник",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.CLINICS_ALL?.value) || 0),
          0
        ),
        color: "#722ed1",
        filterField: "CLINICS_ALL",
      },
      {
        icon: <ReadOutlined />,
        title: "Школ",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.SCHOOLS_ALL?.value) || 0),
          0
        ),
        color: "#52c41a",
        filterField: "SCHOOLS_ALL",
      },
      {
        icon: <SmileOutlined />,
        title: "Детских садов",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.KINDERGARTENS_ALL?.value) || 0),
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
          (sum, i) => sum + (Number(i.BRIGADECOUNT?.value) || 0),
          0
        ),
        color: "#722ed1",
      },
      {
        icon: <UserOutlined />,
        title: "Люди",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.EMPLOYEECOUNT?.value) || 0),
          0
        ),
        color: "#13c2c2",
      },
      {
        icon: <ToolOutlined />,
        title: "Техника",
        value: tns.reduce(
          (sum, i) =>
            sum + (Number(i.SPECIALTECHNIQUECOUNT?.value) || 0),
          0
        ),
        color: "#eb2f96",
      },
      {
        icon: <ThunderboltOutlined />,
        title: "ПЭС",
        value: tns.reduce(
          (sum, i) => sum + (Number(i.PES_COUNT?.value) || 0),
          0
        ),
        color: "#faad14",
      },
    ];

    set({ outages, metrics, stats });
  },

  /**
   * Фильтровать TNS по полю и min‑значению,
   * сохранить в сторе и пересчитать агрегаты.
   * @param {string|null} field
   * @param {number|null} min
   * @param {array} allTns  полный массив ТН
   */
  applyFilter(field = null, min = null, allTns = []) {
    const prevField = get().filterField;
    const prevMin = get().minValue;

    // Если ничего не меняется и filtered уже рассчитан — выходим
    if (field === prevField && min === prevMin && get().filteredTns.length) {
      return;
    }

    let filtered = allTns;

    if (field) {
      if (field === "DISTRICT") {
        filtered = allTns.filter((i) => {
          const v =
            typeof i.DISTRICT === "string"
              ? i.DISTRICT
              : i.DISTRICT?.value || "";
          return !!v && v.trim() !== "" && v.trim() !== "—";
        });
      } else if (min !== null && !isNaN(min)) {
        filtered = allTns.filter((i) => {
          const v = i[field]?.value;
          const num = Number(v);
          return !isNaN(num) && num >= min;
        });
      }
    }

    set({
      filterField: field,
      minValue: min,
      filteredTns: filtered,
    });

    get()._recalcAggregates();
  },

  // --- Координаты для карты ---
  tnCoords: [],

  // --- Кеш DaData ---
  fiasCache: {},

  /**
   * tns — массив ТН из tnsDataStore.
   * Функция собирает все FIAS, тянет DaData (через /api/dadata),
   * складывает результат в fiasCache и формирует tnCoords.
   */
  async loadCoordsFromTns(tns) {
    if (!Array.isArray(tns) || !tns.length) return;

    // 1) Собрать все уникальные FIAS
    const allFias = [];
    tns.forEach((item) => {
      let list = [];
      if (
        item.FIAS_LIST &&
        typeof item.FIAS_LIST === "object" &&
        typeof item.FIAS_LIST.value === "string"
      ) {
        list = item.FIAS_LIST.value.split(";").map((s) => s.trim()).filter(Boolean);
      } else if (typeof item.FIAS_LIST === "string" && item.FIAS_LIST.trim() !== "") {
        list = item.FIAS_LIST.split(";").map((s) => s.trim()).filter(Boolean);
      }
      list.forEach((f) => {
        if (f && !allFias.includes(f)) allFias.push(f);
      });
    });

    // 2) Кеш: не дергаем то, что уже есть
    const cache = { ...get().fiasCache };
    const chunkSize = 5;

    for (let i = 0; i < allFias.length; i += chunkSize) {
      const chunk = allFias.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (fias) => {
          if (cache[fias]) return;

          try {
            const resp = await fetch(
              `/api/dadata?query=${encodeURIComponent(fias)}&mode=findById`
            );
            if (!resp.ok) return;

            const json = await resp.json();
            const suggestion = Array.isArray(json)
              ? json[0]
              : Array.isArray(json?.suggestions)
              ? json.suggestions[0]
              : null;
            if (!suggestion) return;

            cache[fias] = {
              addr:
                suggestion.unrestricted_value ||
                suggestion.value ||
                null,
              lat: suggestion.data?.geo_lat || suggestion.geo_lat || null,
              lon: suggestion.data?.geo_lon || suggestion.geo_lon || null,
            };
          } catch {
            /* network error — игнорируем */
          }
        })
      );
    }

    // 3) Сформировать массив координат (по каждому FIAS!).
    const coordsArr = [];
    tns.forEach((item, idx) => {
      let list = [];
      if (
        item.FIAS_LIST &&
        typeof item.FIAS_LIST === "object" &&
        typeof item.FIAS_LIST.value === "string"
      ) {
        list = item.FIAS_LIST.value.split(";").map((s) => s.trim()).filter(Boolean);
      } else if (typeof item.FIAS_LIST === "string" && item.FIAS_LIST.trim() !== "") {
        list = item.FIAS_LIST.split(";").map((s) => s.trim()).filter(Boolean);
      }

      list.forEach((fias) => {
        const c = cache[fias];
        if (!c || !c.lat || !c.lon) return;

        // Краткая инфа по ТН для балуна
        const pop = item.POPULATION_COUNT?.value || "—";
        const tp  = item.TP_ALL?.value || "—";

        coordsArr.push({
          id: `${item.documentId || idx}-${fias}`,
          coords: [Number(c.lat), Number(c.lon)],
          label: `${item.NAME?.value || "ТН"}<br/>${c.addr}`,
          balloonContent: `
            <div style="font-size:14px;max-width:260px;">
              <strong>${item.NAME?.value || "ТН"}</strong><br/>
              ${c.addr}<br/>
              Население: <b>${pop}</b><br/>
              Отключено&nbsp;ТП: <b>${tp}</b>
            </div>
          `,
        });
      });
    });

    // 4) Сохранить в стор
    set({ fiasCache: cache, tnCoords: coordsArr });
  },
}));
