// src/components/MainContent/hooks/useAutoRefresh.js
import { useEffect, useRef } from "react";
import dayjs from "dayjs";

import { useGlobalStore } from "@/stores/globalStore";
import { useTnsDataStore } from "@/stores/tnsDataStore";

/**
 * Периодически подтягивает «лёгкий» список ТН и
 * проигрывает звук, если появилась запись с более новым createdAt.
 */
export default function useAutoRefresh({ token, expandedKeys }) {
  const { fetchTnsFast, tns } = useTnsDataStore();

  const refreshInterval = useGlobalStore((s) => s.refreshInterval);
  const modalOpen = useGlobalStore((s) => s.modalOpen);

  /* ---------- звук на действительно новую запись ---------- */
  const firstLoadDone = useRef(false);
  const lastCreatedAtRef = useRef(null);

  useEffect(() => {
    if (!tns?.length) return;

    // список уже отсортирован по createdAt:desc
    const newestCreatedAt = tns[0]?.createdAt;

    if (firstLoadDone.current) {
      const isNew =
        newestCreatedAt &&
        (!lastCreatedAtRef.current ||
          dayjs(newestCreatedAt).isAfter(lastCreatedAtRef.current));

      if (isNew) new Audio("/sounds/sound.mp3").play().catch(() => {});
    } else {
      firstLoadDone.current = true;
    }

    if (newestCreatedAt) lastCreatedAtRef.current = newestCreatedAt;
  }, [tns]);

  /* ---------- авто-обновление лёгкого списка ---------- */
  useEffect(() => {
    if (!token || modalOpen || (expandedKeys?.length ?? 0)) return;

    const id = setInterval(() => fetchTnsFast(token), refreshInterval);
    return () => clearInterval(id);
  }, [token, modalOpen, expandedKeys, refreshInterval, fetchTnsFast]);
}
