"use client";
import React from "react";
import { Button } from "antd";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function ButtonLogInOut() {
  const session = useSession();

  if (session.status == "authenticated") {
    return (
      <Button
        type="primary"
        danger
        onClick={async () => {
          console.log("logOut");
          await signOut({ redirect: true, redirectTo: "/" });
        }}
      >
        Выйти
      </Button>
    );
  } else {
    return (
      <Link href={"/login"}>
        <Button type="primary">Войти</Button>
      </Link>
    );
  }
}
