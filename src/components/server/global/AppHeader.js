import Image from "next/image";
import logoBlue from "@/img/logoBlue.svg";
import { Header } from "antd/es/layout/layout";
import ButtonLogInOut from "@/components/client/global/ButtonLogInOut";
import { auth } from "@/config/auth";

export default async function AppHeader() {
  const session = await auth();
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
      <ButtonLogInOut />
    </Header>
  );
}
