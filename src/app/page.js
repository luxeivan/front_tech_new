//-------------------------------------------------
// 1) Заглушка — пока ведутся работы
//-------------------------------------------------
// "use client";
// import React from "react";
// import Portal404 from "@/components/client/Portal404/Portal404";

// export default function Home() {
//   return <Portal404 />;
// }

//-------------------------------------------------
// 2) Рабочая версия
//-------------------------------------------------


"use server";
import React from "react";
import MainContent from "@/components/MainContent/MainContent";
import { auth } from "@/config/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div>
      {session ? (
        <>
          <h1 style={{ textAlign: "center" }}>
            Добро пожаловать, {session.user?.name}
          </h1>
          <MainContent />
        </>
      ) : (
        <h1 style={{ textAlign: "center", padding: 20 }}>
          Пожалуйста авторизируйтесь
        </h1>
      )}
    </div>
  );
}