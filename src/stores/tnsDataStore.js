import { create } from "zustand";
import { useMemo, useState } from "react";

/* ▸ поля, которые реально нужны на главной + для фильтров */
const LIST_FIELDS = [
  // табличные
  "F81_010_NUMBER",
  "SCNAME",
  "OWN_SCNAME",
  "F81_041_ENERGOOBJECTNAME",
  "ADDRESS_LIST",
  "DISPCENTER_NAME_",

  // фильтры
  "STATUS_NAME",
  "VIOLATION_TYPE",
  "OBJECTTYPE81",

  // даты
  "F81_060_EVENTDATETIME",
  "CREATE_DATETIME",
  "F81_070_RESTOR_SUPPLAYDATETIME",
  "F81_290_RECOVERYDATETIME",
];

/* ---------- QS-строители ---------- */
const buildFieldsParam = () =>
  LIST_FIELDS.map((f, i) => `fields[${i}]=${encodeURIComponent(f)}`).join("&");

// src/stores/tnsDataStore.js

const BASE_QS = "populate=*&sort=createdAt:desc";   // ← уже стоит правильно


/* ---------- константы ---------- */
const PAGE_SIZE = 10; // быстрая стартовая страница
const CONC_LIMIT = 8; // ≤ 8 параллельных догрузок

/* ---------- дефолтные объекты для обязательных фильтров ---------- */
const FIELD_DEFAULTS = {
  STATUS_NAME: { value: "", label: "Статус ТН", filter: "Да", edit: "Нет" },
  VIOLATION_TYPE: { value: "", label: "Вид ТН", filter: "Да", edit: "Нет" },
  OBJECTTYPE81: { value: "", label: "Вид объекта", filter: "Да", edit: "Нет" },
  F81_060_EVENTDATETIME: {
    value: null,
    label: "Дата/Время возникновения",
    filter: "Да",
    edit: "Нет",
  },
  CREATE_DATETIME: {
    value: null,
    label: "Дата/Время фиксирования",
    filter: "Да",
    edit: "Нет",
  },
  F81_070_RESTOR_SUPPLAYDATETIME: {
    value: null,
    label: "Дата/Время восстановления (план)",
    filter: "Да",
    edit: "Нет",
  },
  F81_290_RECOVERYDATETIME: {
    value: null,
    label: "Дата/Время восстановления (факт)",
    filter: "Да",
    edit: "Нет",
  },
};

/* патчим запись так, чтобы каждый «обязательный» ключ был в объекте */
const ensureFilterFields = (tn) => {
  const patched = { ...tn };
  Object.entries(FIELD_DEFAULTS).forEach(([k, def]) => {
    if (patched[k] === undefined) patched[k] = { ...def };
  });
  return patched;
};

/* ─────────────────────────────────────────────────────────────── */

export const useTnsDataStore = create((set, get) => ({
  tns: [],
  loading: false,
  error: null,
  _lastFetchAt: null,

  /* ---------- быстрая загрузка ---------- */
  async fetchTnsFast(token) {
    if (get().loading) return;
    set({ loading: true, error: null });

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      /* ─── первая страница ─── */
      const firstURL =
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns` +
        `?pagination[page]=1&pagination[pageSize]=${PAGE_SIZE}&${BASE_QS}`;

      const firstResp = await fetch(firstURL, { headers });
      if (!firstResp.ok) throw new Error(`HTTP ${firstResp.status}`);

      const firstJson = await firstResp.json();
      const page1 = (firstJson.data ?? []).map(ensureFilterFields);
      const totalPages =
        firstJson.meta?.pagination?.pageCount > 0
          ? firstJson.meta.pagination.pageCount
          : 1;

      set({
        tns: page1,
        loading: false,
        _lastFetchAt: new Date().toISOString(),
      });

      /* ─── остальное в фоне ─── */
      if (totalPages > 1) {
        const queue = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const buffer = [];

        while (queue.length) {
          const batch = queue.splice(0, CONC_LIMIT);
          await Promise.allSettled(
            batch.map(async (p) => {
              const url =
                `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?pagination[page]=${p}` +
                `&pagination[pageSize]=${PAGE_SIZE}&${BASE_QS}`;
              try {
                const r = await fetch(url, { headers });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const { data } = await r.json();
                if (Array.isArray(data) && data.length)
                  buffer.push(...data.map(ensureFilterFields));
              } catch (e) {
                console.error(`page ${p} load error →`, e?.message || e);
              }
            })
          );
        }

        if (buffer.length) set((s) => ({ tns: [...s.tns, ...buffer] }));
      }
    } catch (e) {
      set({ error: e?.message || "Fetch error", loading: false });
    }
  },

  /* ---------- полный объект при раскрытии ---------- */
  async fetchDetails(id, token) {
    if (get().tns.find((t) => t.id === id && t._full)) return;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${id}?populate=*`;

    try {
      const res = await fetch(url, { headers });
      if (res.status === 404) return; // запись могла удалиться
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { data } = await res.json();
      if (!data) return;

      set((s) => ({
        tns: s.tns.map((t) =>
          t.id === id ? { ...ensureFilterFields(data), _full: true } : t
        ),
      }));
    } catch (e) {
      console.error("fetchDetails", e?.message || e);
    }
  },

  /* ---------- локальное редактирование ---------- */
  updateField: (tnId, fieldKey, newValue) =>
    set((s) => ({
      tns: s.tns.map((t) =>
        t.id === tnId
          ? { ...t, [fieldKey]: { ...(t[fieldKey] || {}), value: newValue } }
          : t
      ),
    })),
}));

/* -------------------------- фильтры -------------------------- */
export const useTnFilters = (listOverride) => {
  const { tns: storeTns = [] } = useTnsDataStore();
  const sourceRaw = listOverride ?? storeTns;
  const source = Array.isArray(sourceRaw) ? sourceRaw : [];

  const filterableFields = useMemo(() => {
    const s = new Set();
    source.forEach((t) =>
      Object.entries(t).forEach(([k, v]) => {
        if (v && typeof v === "object" && v.filter === "Да") s.add(k);
      })
    );
    return [...s];
  }, [source]);

  const [filters, setFilters] = useState({});
  const setFilterValue = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  const filteredTns = useMemo(
    () =>
      source.filter((item) =>
        filterableFields.every((k) => {
          const sel = filters[k] ?? "Все";
          return sel === "Все" ? true : (item[k]?.value ?? "—") === sel;
        })
      ),
    [source, filterableFields, filters]
  );

  return { filterableFields, filters, setFilterValue, filteredTns };
};
