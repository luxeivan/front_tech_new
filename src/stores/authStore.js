"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      /** ---------- state ---------- */
      token: null, // Strapi-JWT
      isOpenModalAuth: false, // модалка входа
      loading: false,
      error: null,

      /** ---------- actions ---------- */
      openModal: () => set({ isOpenModalAuth: true }),
      closeModal: () => set({ isOpenModalAuth: false }),

      login: async (identifier, password) => {
        set({ loading: true, error: null });

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ identifier, password }),
            }
          );

          const data = await res.json();
          console.log("LOGIN START");
          console.log("STRAPI OK, JWT =", data.jwt);
          if (data.error) {
            /* --- человекочитаемое сообщение --- */
            const translations = {
              "Invalid identifier or password": "Неверный email или пароль",
              "Missing credentials": "Заполните все обязательные поля",
              "Your account has been blocked": "Ваш аккаунт заблокирован",
              "Too many requests": "Слишком много попыток. Попробуйте позже",
            };
            throw new Error(
              translations[data.error.message] || data.error.message
            );
          }

          set({
            token: data.jwt,
            loading: false,
            isOpenModalAuth: false,
          });
        } catch (err) {
          console.error(err);
          set({
            error: err.message.replace("identifier", "email"),
            loading: false,
          });
        }
      },

      logout: () => set({ token: null }),
    }),

    {
      name: "mosoblenergo-jwt",
      partialize: (state) => ({ token: state.token }),
    }
  )
);

export default useAuthStore;
