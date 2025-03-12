"use client";
import { Layout, Button, Modal } from "antd";
import Image from "next/image";
import { useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import logoBlue from '@/img/logoBlue.svg'
import AuthForm from "./AuthForm";

const { Header } = Layout;

export default function AppHeader() {
  const { token, logout, isOpenModalAuth, openModal, closeModal } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false)


  return (
    <Header
      style={{
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}
    >
      {/* Логотип */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Image
          src={logoBlue.src}
          alt="Логотип"
          width={300}
          height={150}
          style={{ objectFit: "contain" }}
        />
      </div>

      {/* Если на сервере, hasMounted === false => кнопка не рендерится */}
      {token && (
        <Button type="primary" danger onClick={logout}>
          Выйти
        </Button>
      )}
      {!token && (
        <Button type="primary" onClick={() => { openModal() }}>
          Войти
        </Button>
      )}


      <Modal title="Авторизация" open={isOpenModalAuth} footer={null} onCancel={() => { closeModal() }}>
        <AuthForm closeModal={closeModal} />
      </Modal>

    </Header>
  );
}
