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

const PAGE_SIZE = 10;
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
    if (get().loading) return;
    set({ loading: true, error: null });

    const qsPopulate = buildPopulateParam();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // ---------- первая страница ----------
      const firstURL =
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?pagination[page]=1` +
        `&pagination[pageSize]=${PAGE_SIZE}&${qsPopulate}`;

      const firstResp = await fetch(firstURL, { headers });
      if (!firstResp.ok) throw new Error(`HTTP ${firstResp.status}`);

      const firstJson = await firstResp.json();
      const page1 = Array.isArray(firstJson?.data) ? firstJson.data : [];
      const totalPages =
        firstJson?.meta?.pagination?.pageCount > 0
          ? firstJson.meta.pagination.pageCount
          : 1;

      // кладём только первую страницу
      set({
        tns: page1,
        loading: false,
        _lastFetchAt: new Date().toISOString(),
      });

      // ---------- остальное в фоне ----------
      if (totalPages > 1) {
        const queue = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const buffer = []; // сюда копим все страницы

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
                if (Array.isArray(data) && data.length) buffer.push(...data);
              } catch (e) {
                console.error(`page ${p} load error →`, e?.message || e);
              }
            })
          );
        }

        if (buffer.length) {
          // единый set — таблица перерисуется один раз
          set((s) => ({ tns: [...s.tns, ...buffer] }));
        }
      }
    } catch (e) {
      if (String(e?.message).startsWith("HTTP 400")) {
        // fallback без populate
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
    // если уже загружали – повторно не идём
    if (get().tns.find((t) => t.id === id && t._full)) return;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${id}?populate=*`;

    try {
      const res = await fetch(url, { headers });

      // 404 — запись пропала; просто выходим без выброса ошибки
      if (res.status === 404) {
        console.warn(`TN ${id} not found (404) – скрываю сообщение`);
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { data } = await res.json();
      if (!data) return;

      // помечаем запись как «полная»
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
