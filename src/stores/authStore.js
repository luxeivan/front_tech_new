'use client'
import { create } from "zustand";
import { strapi } from '@strapi/client';

const useAuthStore = create((set, get) => ({
    token: typeof window !== "undefined" ? localStorage.getItem("jwt") : undefined,
    isOpenModalAuth: false,
    loading: false,
    error: null,

    // client: strapi({
    //         baseURL: `${process.env.NEXT_PUBLIC_STRAPI_URL}/api`,
    //         auth: localStorage.getItem("jwt") ? localStorage.getItem("jwt") : undefined,
    //     }),
    closeModal: () => {
        set({ isOpenModalAuth: false, });
    },
    openModal: () => {
        console.log(123);

        set({ isOpenModalAuth: true, });
    },
    login: async (identifier, password) => {
        set({ loading: true, error: null });
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await response.json();


            // const response = await get().client.fetch('/auth/local', {
            //     method: 'POST',
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ identifier, password }),
            // });
            // const data = await response.json();
            // console.log(data)

            // В хранилище authStore.js
            if (data.error) {
                let message = data.error.message;

                // Добавляем все возможные переводы
                const errorTranslations = {
                    "Invalid identifier or password": "Неверный email или пароль",
                    "Missing credentials": "Заполните все обязательные поля",
                    "Your account has been blocked": "Ваш аккаунт заблокирован",
                    "Too many requests": "Слишком много попыток. Попробуйте позже",
                };

                message = errorTranslations[message] || message;
                throw new Error(message);
            }

            localStorage.setItem("jwt", data.jwt);
            set({ token: data.jwt, loading: false, isOpenModalAuth: false });
        } catch (err) {
            console.log(err)
            set({
                error: err.message.replace("identifier", "email"), // Заменяем терминологию
                loading: false,
            });
        }
    },

    logout: () => {
        localStorage.removeItem("jwt");
        set({ token: null });
    },
}));

export default useAuthStore;
