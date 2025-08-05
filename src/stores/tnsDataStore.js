import { create } from "zustand";
import { useMemo, useState } from "react";

/* ▸ какие поля нужны на главной */
const LIST_FIELDS = [
  "F81_010_NUMBER",
  "SCNAME",
  "OWN_SCNAME",
  "F81_041_ENERGOOBJECTNAME",
  "ADDRESS_LIST",
  "DISPCENTER_NAME_",
  "STATUS_NAME",
  "F81_060_EVENTDATETIME",
];

const PAGE_SIZE = 100;
const CONC_LIMIT = 8; 

const buildPopulateParam = () =>
  LIST_FIELDS.map((f, i) => `populate[${i}]=${encodeURIComponent(f)}`).join(
    "&"
  );

export const useTnsDataStore = create((set, get) => ({
  tns: [],
  loading: false,
  error: null,
  _lastFetchAt: null,

  async fetchTnsFast(token) {
    if (get().loading) return; // защита от дублей
    set({ loading: true, error: null });

    const qsPopulate = buildPopulateParam();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      /* 1. Первая страница — показываем спинер */
      const firstURL =
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?pagination[page]=1` +
        `&pagination[pageSize]=${PAGE_SIZE}&${qsPopulate}`;

      const firstResp = await fetch(firstURL, { headers });
      if (!firstResp.ok) throw new Error(`HTTP ${firstResp.status}`);

      const firstJson = await firstResp.json();
      console.log("sample item from Strapi →", firstJson.data?.[0]);

      const page1 = Array.isArray(firstJson?.data) ? firstJson.data : [];
      const totalPages =
        firstJson?.meta?.pagination?.pageCount > 0
          ? firstJson.meta.pagination.pageCount
          : 1;

      set({
        tns: page1,
        loading: false,
        _lastFetchAt: new Date().toISOString(),
      });

      /* 2. Фоновая догрузка остальных страниц */
      if (totalPages > 1) {
        const queue = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

        while (queue.length) {
          const batch = queue.splice(0, CONC_LIMIT);

          await Promise.allSettled(
            batch.map(async (p) => {
              try {
                const url =
                  `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?pagination[page]=${p}` +
                  `&pagination[pageSize]=${PAGE_SIZE}&${qsPopulate}`;

                const r = await fetch(url, { headers });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const { data } = await r.json();
                if (Array.isArray(data) && data.length) {
                  set((s) => ({ tns: [...s.tns, ...data] }));
                }
              } catch (e) {
                console.error(`page ${p} load error →`, e?.message || e);
              }
            })
          );
        }
      }
    } catch (e) {
      /* если вдруг формат fields опять не подошёл — пробуем без него */
      if (String(e?.message).startsWith("HTTP 400")) {
        console.warn("Retry without fields param (fallback)");
        try {
          const url =
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?pagination[page]=1` +
            `&pagination[pageSize]=${PAGE_SIZE}`;
          const r = await fetch(url, { headers });
          const j = await r.json();
          set({
            tns: Array.isArray(j?.data) ? j.data : [],
            loading: false,
            _lastFetchAt: new Date().toISOString(),
            error: null,
          });
          return;
        } catch {}
      }
      set({ error: e?.message || "Fetch error", loading: false });
    }
  },

  /* ---------- полный объект при раскрытии ---------- */
  async fetchDetails(id, token) {
    if (get().tns.find((t) => t.id === id && t._full)) return;
    try {
      const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${id}?populate=*`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      if (!data) return;
      set((s) => ({
        tns: s.tns.map((t) => (t.id === id ? { ...data, _full: true } : t)),
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

/* =================================================================== */
/*                          FILTER  HOOK                               */
/* =================================================================== */
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
