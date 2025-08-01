import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useGlobalStore = create(
  persist(
    (set) => ({
      refreshIntervalMs: 60_000,
      setRefreshInterval: (ms) => set({ refreshIntervalMs: ms }),

      modalOpen: false,
      setModalOpen: (open) => set({ modalOpen: open }),
    }),
    { name: "global-store" }
  )
);
