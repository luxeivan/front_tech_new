// src/stores/incidentsDataStore.js
import { create } from "zustand";

export const useIncidentsDataStore = create((set) => ({
  incidents: [],
  loading: false,
  error: null,

  // ───────────────────────── fetch ─────────────────────────
  fetchIncidents: async (token) => {
    set({ loading: true, error: null });
    try {
      const url =
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/incidents?` +
        "populate[AddressInfo][populate]=Street&populate=DisruptionStats";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      set({ incidents: json.data || [] });
    } catch (e) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  // ───────────────── локальное обновление ─────────────────
  /** Пометить, что конкретный инцидент уже отправлен в Telegram */
  markSentToTelegram: (documentId) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.documentId === documentId ? { ...inc, sent_to_telegram: true } : inc
      ),
    })),
}));
