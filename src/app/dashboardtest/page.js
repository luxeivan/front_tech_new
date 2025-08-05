"use client";

import { useEffect, useState } from "react";
import { Typography, Spin } from "antd";
import { useSession } from "next-auth/react";

const { Title } = Typography;

/* ---------- helpers ------------------------------------------------ */

/** Вернёт массив объектов: { guid, createdAt, dispNum } */
async function getGuidRecords({ token, statusValue = null }) {
  const pageSize = 100;
  let page = 1;
  const out = [];
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // populate и GUID, и номер ТН
  const populateQs =
    "populate[0]=VIOLATION_GUID_STR&populate[1]=F81_010_NUMBER";

  while (true) {
    const qs = [
      `pagination[page]=${page}`,
      `pagination[pageSize]=${pageSize}`,
      populateQs,
    ];
    if (statusValue) {
      qs.push(
        "filters[STATUS_NAME][value][$eqi]=" + encodeURIComponent(statusValue)
      );
    }

    const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?${qs.join("&")}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const items = json.data ?? [];

    out.push(
      ...items
        .map((i) => {
          const attr = i.attributes ?? i;

          const guid =
            attr?.VIOLATION_GUID_STR?.value ?? i?.VIOLATION_GUID_STR?.value;

          const dispObj = attr?.F81_010_NUMBER ?? i?.F81_010_NUMBER;
          const dispNum =
            typeof dispObj?.value !== "undefined" ? dispObj.value : dispObj;

          return guid
            ? {
                guid,
                createdAt: attr?.createdAt ?? i?.createdAt,
                dispNum,
              }
            : null;
        })
        .filter(Boolean)
    );

    const { pageCount } = json.meta?.pagination ?? {};
    if (!pageCount || page >= pageCount) break;
    page += 1;
  }
  return out;
}

async function getGuidList({ token, statusValue }) {
  const recs = await getGuidRecords({ token, statusValue });
  return recs.map((r) => r.guid);
}

/* ---------- component ---------------------------------------------- */
export default function DashboardTest() {
  const { data: session, status } = useSession();
  const token = session?.user?.jwt ?? null;

  const [uniqueOpen, setUniqueOpen] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    (async () => {
      try {
        const [openRecs, poweredGuids, closedGuids, allGuids] =
          await Promise.all([
            getGuidRecords({ token, statusValue: "открыта" }),
            getGuidList({ token, statusValue: "запитана" }),
            getGuidList({ token, statusValue: "закрыта" }),
            getGuidList({ token }), // вся база (для «без статуса»)
          ]);

        // GUID-ы, встречающиеся НЕ у «открытых»
        const others = new Set([
          ...poweredGuids,
          ...closedGuids,
          ...allGuids.filter(
            (g) =>
              !openRecs.some((r) => r.guid === g) && // не открыт
              !poweredGuids.includes(g) &&
              !closedGuids.includes(g)
          ),
        ]);

        const unique = openRecs.filter((r) => !others.has(r.guid));
        setUniqueOpen(unique);
      } catch (e) {
        console.error("dashboardtest fetch", e);
        setErr(true);
      }
    })();
  }, [status, token]);

  const isLoading = uniqueOpen === null;

  /* ---------- UI ---------------------------------------------------- */
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      {isLoading && !err && <Spin size="large" />}

      {!isLoading && !err && (
        <>
          <Title level={3} style={{ margin: 0 }}>
            Уникальные&nbsp;«открытые» —&nbsp;
            <span style={{ fontWeight: 700 }}>
              {uniqueOpen.length.toLocaleString("ru-RU")}
            </span>
          </Title>

          <div
            style={{
              maxHeight: 440,
              width: "95%",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: 6,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead
                style={{ position: "sticky", top: 0, background: "#fafafa" }}
              >
                <tr>
                  <th style={thStyle}>№ ТН</th>
                  <th style={thStyle}>GUID</th>
                  <th style={thStyle}>Дата&nbsp;добавления</th>
                </tr>
              </thead>
              <tbody>
                {uniqueOpen.map(({ guid, createdAt, dispNum }) => (
                  <tr key={guid}>
                    <td style={tdStyle}>{dispNum ?? "—"}</td>
                    <td style={{ ...tdStyle, wordBreak: "break-all" }}>
                      {guid}
                    </td>
                    <td style={tdStyle}>
                      {new Date(createdAt).toLocaleString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

/* --- simple cell styles --- */
const thStyle = {
  padding: "4px 8px",
  borderBottom: "1px solid #ddd",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "4px 8px",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
};
