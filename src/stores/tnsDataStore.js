import { create } from "zustand";

export const useTnsDataStore = create((set) => ({
  tns: [],
  loading: false,
  error: null,

  /** Получить список всех ТН */
  fetchTns: async (token) => {
    set({ loading: true, error: null });
    try {
      const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?populate=*`;
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
