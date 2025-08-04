import { useEffect, useRef } from "react";
import { useGlobalStore } from "@/stores/globalStore";
import { useTnsDataStore } from "@/stores/tnsDataStore";

export default function useAutoRefresh({ token, fetchFn, expandedKeys }) {
  const refreshInterval = useGlobalStore((s) => s.refreshInterval);
  const modalOpen = useGlobalStore((s) => s.modalOpen);
  const { tns } = useTnsDataStore();

  /* ---------- автозвук при новых ТН ---------- */
  const prevIds = useRef([]);
  useEffect(() => {
    if (!tns?.length) return;
    const curIds = tns.map((t) => t.id);
    const diff = curIds.filter((id) => !prevIds.current.includes(id));
    if (diff.length) new Audio("/sounds/sound.mp3").play().catch(() => {});
    prevIds.current = curIds;
  }, [tns]);

  /* ---------- авто-обновление ---------- */
  useEffect(() => {
    if (!token || modalOpen || (expandedKeys?.length ?? 0)) return;
    const id = setInterval(() => fetchFn(token), refreshInterval);
    return () => clearInterval(id);
  }, [token, modalOpen, expandedKeys, refreshInterval, fetchFn]);
}
