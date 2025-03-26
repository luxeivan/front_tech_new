//Заглушечка, комментим её, когда не надо
// import { redirect } from "next/navigation";

// export default async function Home() {
//   redirect("/stub");
// }


//А вот это раскоментиваем
"use server";
import MainContent from "@/components/MainContent/MainContent";
import { auth } from "@/config/auth";

export default async function Home() {
  const session = await auth();

  const { token } = false;
  return (
    <div>
      {session && (
        <>
          <h1 style={{ textAlign: "center" }}>
            Добро пожаловать, {session.user?.name}
          </h1>
          <MainContent />
        </>
      )}
      {!session && (
        <h1 style={{ textAlign: "center", padding: 20 }}>
          Пожалуйста авторизируйтесь
        </h1>
      )}
    </div>
  );
}
