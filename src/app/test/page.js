'use client';

import { useEffect } from 'react';
import { useTestStore } from '@/stores/testStore';

// Страница для тестирования SSE
export default function TestPage() {
  const messages = useTestStore((state) => state.messages);
  const addMessage = useTestStore((state) => state.addMessage);

  useEffect(() => {
    // Подключаемся к SSE-эндпоинту
    const evtSource = new EventSource('/api/event');
    evtSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        addMessage(data);
      } catch (err) {
        console.error('Ошибка парсинга SSE-сообщения', err);
      }
    };
    evtSource.onerror = (err) => {
      console.error('SSE ошибка', err);
      evtSource.close();
    };
    return () => {
      evtSource.close();
    };
  }, [addMessage]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Тестовая страница SSE</h1>
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>{JSON.stringify(msg)}</li>
        ))}
      </ul>
    </div>
  );
}
