import { useState, useMemo, useEffect } from "react";
import { create } from "zustand";

export const useTnsDataStore = create((set) => ({
  tns: [],
  loading: false,
  error: null,

  /** Получить список всех ТН */
  fetchTns: async (token) => {
    set({ loading: true, error: null });
    try {
      // const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?populate=*`;
      const url =
        `${process.env.NEXT_PUBLIC_STRAPI_URL}` +
        `/api/tns?populate=*&pagination[pageSize]=500`; // или крутись по страницам циклом
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      set({ tns: json.data || [] });
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

/**
 * Хук для вычисления списка фильтруемых полей, хранения выбранных значений
 * и получения отфильтрованного массива ТН.
 *
 * @returns {
 *   filterableFields: string[],
 *   filters: Record<string,string>,
 *   setFilterValue: (key:string,value:string)=>void,
 *   filteredTns: any[]
 * }
 */
export const useTnFilters = () => {
  const { tns } = useTnsDataStore();

  /* какие поля имеют meta.filter === 'Да' */
  const filterableFields = useMemo(() => {
    const set = new Set();
    tns.forEach((t) => {
      Object.entries(t).forEach(([k, v]) => {
        if (v && typeof v === "object" && v.filter === "Да") set.add(k);
      });
    });
    return Array.from(set);
  }, [tns]);

  /* выбранные значения ("Все" по умолчанию) */
  const [filters, setFilters] = useState({});

  /* обновлять фильтр по одному полю */
  const setFilterValue = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  /* пересчитываем отфильтрованный список */
  const filteredTns = useMemo(() => {
    return tns.filter((item) =>
      filterableFields.every((key) => {
        const selected = filters[key] ?? "Все";
        if (selected === "Все") return true;
        return (item[key]?.value ?? "—") === selected;
      })
    );
  }, [tns, filterableFields, filters]);

  return { filterableFields, filters, setFilterValue, filteredTns };
};

/**
 * Хук пагинации. Принимает массив элементов и pageSize,
 * возвращает текущую страницу и слайс элементов.
 *
 * @param {any[]} list
 * @param {number} pageSizeInit
 */
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
