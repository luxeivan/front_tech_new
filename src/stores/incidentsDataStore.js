import { create } from "zustand";

export const useIncidentsDataStore = create((set) => ({
  incidents: [],
  loading: false,
  error: null,

  fetchIncidents: async (token) => {
    set({ loading: true, error: null });
    try {
      const url =
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/incidents?` +
        "populate[AddressInfo][populate]=city_district&populate=DisruptionStats";
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      set({ incidents: result.data || [] });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },
}));
