import { useState, useMemo, useEffect } from "react";
import { create } from "zustand";

export const useTnsDataStore = create((set) => ({
  tns: [],
  loading: false,
  error: null,


  fetchTns: async (token) => {
    set({ loading: true, error: null });
    try {
      const pageSize = 100; // размер страницы (можно подстроить)
      let page = 1;
      let all = [];
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      while (true) {
        const url =
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?populate=*` +
          `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const json = await res.json();
        const chunk = json.data || [];
        all = all.concat(chunk);

        // если пришло меньше pageSize, это была последняя страница
        if (chunk.length < pageSize) break;
        page += 1;
      }

      set({ tns: all });
    } catch (e) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  /* локально изменить значение одного поля для конкретного ТН */
  updateField: (tnId, fieldKey, newValue) =>
    set((state) => ({
      tns: state.tns.map((tn) =>
        tn.id === tnId
          ? {
              ...tn,
              [fieldKey]: {
                ...(tn[fieldKey] || {}),
                value: newValue,
              },
            }
          : tn
      ),
    })),
}));


export const useTnFilters = (listOverride) => {
  const { tns } = useTnsDataStore();
  const source = listOverride ?? tns;

  /* какие поля имеют meta.filter === 'Да' */
  const filterableFields = useMemo(() => {
    const set = new Set();
    source.forEach((t) => {
      Object.entries(t).forEach(([k, v]) => {
        if (v && typeof v === "object" && v.filter === "Да") set.add(k);
      });
    });
    return Array.from(set);
  }, [source]);

  /* выбранные значения ("Все" по умолчанию) */
  const [filters, setFilters] = useState({});

  /* обновлять фильтр по одному полю */
  const setFilterValue = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  /* пересчитываем отфильтрованный список */
  const filteredTns = useMemo(() => {
    return source.filter((item) =>
      filterableFields.every((key) => {
        const selected = filters[key] ?? "Все";
        if (selected === "Все") return true;
        return (item[key]?.value ?? "—") === selected;
      })
    );
  }, [source, filterableFields, filters]);

  return { filterableFields, filters, setFilterValue, filteredTns };
};


export const usePaging = (list, pageSizeInit = 10) => {
  const [page, setPage] = useState(1);
  const pageSize = pageSizeInit;

  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

  /* если исходный список укорачивается, сбрасываем страницу */
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(list.length / pageSize));
    if (page > maxPage) setPage(1);
  }, [list.length, page, pageSize]);

  return { page, setPage, current, pageSize };
};
