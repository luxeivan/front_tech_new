"use client";

import { useEffect, useState } from "react";
import { Typography, Spin } from "antd";
import { useSession } from "next-auth/react";

const { Title } = Typography;

async function getTotal({ token, statusValue = null }) {
  const qsParts = ["pagination[page]=1", "pagination[pageSize]=1"];
  if (statusValue) {
    qsParts.push(
      "filters[STATUS_NAME][value][$eqi]=" + encodeURIComponent(statusValue)
    );
  }

  const url =
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?` + qsParts.join("&");

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  return json.meta?.pagination?.total ?? 0;
}

export default function DashboardTest() {
  /* auth-состояние от next-auth */
  const { data: session, status } = useSession(); // status: "loading" | "authenticated" | "unauthenticated"
  const token = session?.user?.jwt ?? null;

  /* три независимых стейта, чтобы избежать мигания */
  const [allCnt, setAllCnt] = useState(null); // null → ждём; number → ок; "err" → ошибка
  const [openCnt, setOpenCnt] = useState(null);
  const [poweredCnt, setPoweredCnt] = useState(null);
  const [closedCnt, setClosedCnt] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    (async () => {
      try {
        const [tot, open, powered, closed] = await Promise.all([
          getTotal({ token }),
          getTotal({ token, statusValue: "открыта" }),
          getTotal({ token, statusValue: "запитана" }),
          getTotal({ token, statusValue: "закрыта" }),
        ]);
        setAllCnt(tot);
        setOpenCnt(open);
        setPoweredCnt(powered);
        setClosedCnt(closed);
      } catch (e) {
        console.error("dashboardtest fetch", e);
        setErr(true);
      }
    })();
  }, [status, token]);

  /* -------- RENDER -------- */
  const isLoading =
    allCnt === null ||
    openCnt === null ||
    poweredCnt === null ||
    closedCnt === null;
  // вычисляем количество ТН без явно заданного статуса
  const noStatusCnt =
    !isLoading ? allCnt - openCnt - poweredCnt - closedCnt : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <Title level={2} style={{ margin: 0 }}>
        Всего ТН в базе
      </Title>

      {isLoading && !err && <Spin size="large" />}

      {!isLoading && !err && (
        <>
          <Title style={{ margin: 0, fontSize: 72, lineHeight: 1 }}>
            {allCnt.toLocaleString("ru-RU")}
          </Title>

          <Title level={3} style={{ margin: 0 }}>
            Из них&nbsp;«открыта» —&nbsp;
            <span style={{ fontWeight: 700 }}>
              {openCnt.toLocaleString("ru-RU")}
            </span>
          </Title>
          <Title level={3} style={{ margin: 0 }}>
            Из них&nbsp;«запитана» —&nbsp;
            <span style={{ fontWeight: 700 }}>
              {poweredCnt.toLocaleString("ru-RU")}
            </span>
          </Title>
          <Title level={3} style={{ margin: 0 }}>
            Из них&nbsp;«закрыта» —&nbsp;
            <span style={{ fontWeight: 700 }}>
              {closedCnt.toLocaleString("ru-RU")}
            </span>
          </Title>
          <Title level={3} style={{ margin: 0 }}>
            Без&nbsp;статуса —&nbsp;
            <span style={{ fontWeight: 700 }}>
              {noStatusCnt.toLocaleString("ru-RU")}
            </span>
          </Title>
        </>
      )}

      {err && (
        <Title level={4} type="danger" style={{ margin: 0 }}>
          Не удалось загрузить данные
        </Title>
      )}
    </div>
  );
}
