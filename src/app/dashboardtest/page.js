"use client";

import { useEffect, useState } from "react";
import { Typography, Spin } from "antd";
import { useSession } from "next-auth/react";

const { Title } = Typography;

/* получить список всех VIOLATION_GUID */
async function getViolationGuids({ token, statusValue = null }) {
  const pageSize = 100;              // безопасный лимит Strapi
  let page = 1;
  let all = [];
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  while (true) {
    const qs = [
      `pagination[page]=${page}`,
      `pagination[pageSize]=${pageSize}`,
      "populate=VIOLATION_GUID_STR",      // обязательно тянем компонент с GUID
    ];
    if (statusValue) {
      qs.push(
        "filters[STATUS_NAME][value][$eqi]=" + encodeURIComponent(statusValue)
      );
    }
    const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?` + qs.join("&");
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const items = json.data ?? [];
    all.push(
      ...items
        .map(
          (i) =>
            i?.attributes?.VIOLATION_GUID_STR?.value ??
            i?.VIOLATION_GUID_STR?.value
        )
        .filter(Boolean)
    );

    const { pageCount } = json.meta?.pagination ?? {};
    if (!pageCount || page >= pageCount) break;
    page += 1;
  }

  // возвращаем полный список, дубликаты сохраняются
  return all; // возвращаем полный список, дубликаты сохраняются
}

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
  const { data: session, status } = useSession();
  const token = session?.user?.jwt ?? null;

  const [allCnt, setAllCnt] = useState(null);
  const [openCnt, setOpenCnt] = useState(null);
  const [poweredCnt, setPoweredCnt] = useState(null);
  const [closedCnt, setClosedCnt] = useState(null);
  const [guidList, setGuidList] = useState(null);
  const [openGuidList, setOpenGuidList] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    (async () => {
      try {
        const [
          tot,
          open,
          powered,
          closed,
          guids,
          openGuids,
        ] = await Promise.all([
          getTotal({ token }),
          getTotal({ token, statusValue: "открыта" }),
          getTotal({ token, statusValue: "запитана" }),
          getTotal({ token, statusValue: "закрыта" }),
          getViolationGuids({ token }),
          getViolationGuids({ token, statusValue: "открыта" }),
        ]);
        setAllCnt(tot);
        setOpenCnt(open);
        setPoweredCnt(powered);
        setClosedCnt(closed);
        setGuidList(guids);
        setOpenGuidList(openGuids);
      } catch (e) {
        console.error("dashboardtest fetch", e);
        setErr(true);
      }
    })();
  }, [status, token]);

  const isLoading =
    allCnt === null ||
    openCnt === null ||
    poweredCnt === null ||
    closedCnt === null ||
    guidList === null ||
    openGuidList === null;

  const noStatusCnt = !isLoading
    ? allCnt - openCnt - poweredCnt - closedCnt
    : 0;

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

      {!isLoading && !err && guidList?.length > 0 && (
        <>
          <Title level={4} style={{ margin: 0 }}>GUID‑список</Title>
          <div
            style={{
              maxWidth: "80%",
              maxHeight: 160,
              overflowY: "auto",
              textAlign: "center",
              fontSize: 12,
              lineHeight: 1.4,
              opacity: 0.8,
              wordBreak: "break-all",
            }}
          >
            {guidList.join(", ")}
          </div>
        </>
      )}

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
          {openGuidList?.length > 0 && (
            <div
              style={{
                maxWidth: "80%",
                maxHeight: 120,
                overflowY: "auto",
                textAlign: "center",
                fontSize: 11,
                lineHeight: 1.4,
                opacity: 0.75,
                wordBreak: "break-all",
                marginBottom: 8,
              }}
            >
              {openGuidList.join(", ")}
            </div>
          )}
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
