/**
 * Стор для <MainContent />.
 * Держим локальные «UI-состояния», чтобы сам компонент стал чище.
 */
import { create } from "zustand";

export const useMainContentStore = create((set) => ({
  // ── пагинация ──────────────────────
  page: 1,
  pageSize: 10,
  setPage: (p) => set({ page: p }),
  setPageSize: (ps) => set({ pageSize: ps }),

  // ── модалка редактирования поля ────
  editing: null, // { tnId, docId, fieldKey, label, value }
  editValue: "",
  openEdit: (payload) =>
    set({ editing: payload, editValue: payload.value ?? "" }),
  setEditValue: (v) => set({ editValue: v }),
  closeEdit: () => set({ editing: null, editValue: "" }),
}));
