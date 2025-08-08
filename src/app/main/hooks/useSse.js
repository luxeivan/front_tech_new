"use client";

// Простая подписка на SSE /api/event
import { useEffect } from "react";

export default function useSse(enabled, onMessage) {
  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource("/api/event");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage?.(data);
      } catch (err) {
        console.error("Ошибка разбора SSE-сообщения:", err);
      }
    };
    es.onerror = (err) => {
      console.error("SSE error:", err);
      es.close();
    };
    return () => es.close();
  }, [enabled, onMessage]);
}
