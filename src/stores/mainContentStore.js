import { create } from "zustand";

/** локальный UI-store MainContent */
export const useMainContentStore = create((set) => ({
  /* пагинация */
  page: 1,
  pageSize: 10,
  setPage: (p) => set({ page: p }),
  setPageSize: (ps) => set({ pageSize: ps }),

  /* модалка редактирования */
  editing: null, // { tnId, docId, fieldKey, label, value }
  editValue: "",
  openEdit: (p) => set({ editing: p, editValue: p?.value ?? "" }),
  setEditValue: (v) => set({ editValue: v }),
  closeEdit: () => set({ editing: null, editValue: "" }),

  /* раскрытые строки таблицы */
  expandedKeys: [],
  setExpandedKeys: (keys) => set({ expandedKeys: keys }),
}));
