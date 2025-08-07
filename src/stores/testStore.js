import { create } from 'zustand';

// Хранилище для тестовых сообщений SSE
export const useTestStore = create((set) => ({
  messages: [],
  // Добавляем новое сообщение в массив
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
}));
