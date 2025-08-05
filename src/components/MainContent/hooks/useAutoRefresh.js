import { useEffect, useRef } from "react";
import { useGlobalStore } from "@/stores/globalStore";
import { useTnsDataStore } from "@/stores/tnsDataStore";

/* получает только «лёгкий» список раз в refreshInterval */
export default function useAutoRefresh({ token, expandedKeys }) {
  const { fetchTnsFast, tns } = useTnsDataStore();
  const refreshInterval = useGlobalStore((s) => s.refreshInterval);
  const modalOpen = useGlobalStore((s) => s.modalOpen);

  /* звук на новые ID – как раньше */
  const prevIds = useRef([]);
  useEffect(() => {
    if (!tns?.length) return;
    const cur = tns.map((t) => t.id);
    const diff = cur.filter((id) => !prevIds.current.includes(id));
    if (diff.length) new Audio("/sounds/sound.mp3").play().catch(() => {});
    prevIds.current = cur;
  }, [tns]);

  /* авто-обновление */
  useEffect(() => {
    if (!token || modalOpen || (expandedKeys?.length ?? 0)) return;
    const id = setInterval(() => fetchTnsFast(token), refreshInterval);
    return () => clearInterval(id);
  }, [token, modalOpen, expandedKeys, refreshInterval, fetchTnsFast]);
}
