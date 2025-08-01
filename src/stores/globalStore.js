import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useGlobalStore = create(
  persist(
    (set) => ({
      modalOpen: false,
      refreshInterval: 60_000,

      setModalOpen: (open) => set({ modalOpen: open }),
      setRefreshInterval: (ms) => set({ refreshInterval: ms }),
    }),
    { name: "global-store" }
  )
);
