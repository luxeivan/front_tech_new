'use client'
import MainContent from "@/components/MainContent/MainContent";
import useAuthStore from "@/stores/authStore";

export default function Home() {
  const { token } = useAuthStore();
  return (
    <div >
      {token &&
        <MainContent />
      }
      {!token &&
        <h1>Пожалуйста авторизируйтесь</h1>
      }
    </div>
  );
}
