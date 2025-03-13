import Image from "next/image";
import logoBlue from '@/img/logoBlue.svg'
import { Header } from "antd/es/layout/layout";
import ButtonLogInOut from "@/components/client/global/ButtonLogInOut";
import { auth } from "@/config/auth";

export default async function AppHeader() {
  const session = await auth()
  // const { token, logout, isOpenModalAuth, openModal, closeModal } = useAuthStore();
  // console.log(session)
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

      {/* {token && (
        <Button type="primary" danger onClick={logout}>
          Выйти
        </Button>
      )} */}

      <ButtonLogInOut />

    </Header>
  );
}
