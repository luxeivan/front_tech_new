"use client";

import "@/app/globals.css";

import { useEffect, useMemo, useState } from "react";
import { Table, Typography, Spin, Descriptions, Card } from "antd";
import { useSession } from "next-auth/react";
import { useDashboardTestStore } from "@/stores/dashboardTestStore";

const { Title } = Typography;

/* ---- helpers ---------------------------------------------------- */
const val = (obj) =>
  typeof obj === "object" && obj !== null && "value" in obj ? obj.value : obj;

const formatDate = (d) =>
  d
    ? new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(d))
    : "—";

/* ---------------------------------------------------------------- */
export default function MainPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.jwt ?? null;

  const { uniqueOpen, isLoading, error, loadUnique } = useDashboardTestStore();

  // countdown until auto-refresh
  const [countdown, setCountdown] = useState(60);
  // track which row is expanded
  const [expandedKeys, setExpandedKeys] = useState([]);

  // auto-refresh every second; reload when countdown hits zero and no row is expanded
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (expandedKeys.length === 0) window.location.reload();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [expandedKeys]);

  /* если зашли напрямую — подгружаем */
  useEffect(() => {
    if (status === "authenticated" && uniqueOpen.length === 0) {
      loadUnique(token);
    }
  }, [status, token, uniqueOpen.length, loadUnique]);

  const sorted = [...uniqueOpen].sort(
    (a, b) =>
      new Date(val(b.F81_060_EVENTDATETIME) || b.createdAt) -
      new Date(val(a.F81_060_EVENTDATETIME) || a.createdAt)
  );

  const dataSource = useMemo(
    () =>
      sorted.map((r) => ({
        key: r.guid,
        number: val(r.F81_010_NUMBER),
        object: val(r.F81_042_DISPNAME),
        address: val(r.ADDRESS_LIST),
        center: val(r.DISPCENTER_NAME_),
        event: formatDate(val(r.F81_060_EVENTDATETIME)),
        full: r,
      })),
    [uniqueOpen]
  );

  const columns = [
    { title: "№ ТН", dataIndex: "number", key: "number", width: 120 },
    { title: "Объект", dataIndex: "object", key: "object", responsive: ["md"] },
    { title: "Адрес", dataIndex: "address", key: "address", responsive: ["lg"] },
    {
      title: "Дисп. центр",
      dataIndex: "center",
      key: "center",
      width: 160,
      responsive: ["md"],
    },
    {
      title: "Дата/время возникновения",
      dataIndex: "event",
      key: "event",
      width: 180,
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ position: 'absolute', top: 16, right: 24, color: '#888' }}>
        Обновление через: {countdown}s
      </div>
      <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
        {`Всего открытых ТН: ${uniqueOpen.length}`}
      </Title>

      {isLoading && !error && (
        <div style={{ textAlign: "center", padding: 100 }}>
          <Spin size="large" />
        </div>
      )}

      {error && (
        <Title level={4} type="danger" style={{ textAlign: "center" }}>
          {error}
        </Title>
      )}

      {!isLoading && !error && (
        <Card
          style={{ borderRadius: 16, boxShadow: "0 8px 18px rgba(0,0,0,0.05)" }}
          bodyStyle={{ padding: 24, backgroundColor: "#f0f8ff" }}
        >
          <Table
            columns={columns}
            dataSource={dataSource}
            bordered
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowClassName={(record, index) => index % 2 === 0 ? 'row-light' : ''}
            expandable={{
              expandedRowRender: (record) => (
                <Descriptions
                  size="small"
                  column={1}
                  bordered
                  items={Object.entries(record.full).map(([k, v]) => ({
                    key: k,
                    label:
                      v && typeof v === 'object' && 'label' in v && v.label
                        ? v.label
                        : k,
                    children:
                      v == null
                        ? "Нет данных"
                        : v && typeof v === "object" && "value" in v
                          ? String(v.value)
                          : String(v),
                  }))}
                />
              ),
              rowExpandable: () => true,
              expandedRowKeys: expandedKeys,
              onExpand: (expanded, record) => {
                setExpandedKeys(expanded ? [record.key] : []);
              },
            }}
            scroll={{ x: true }}
          />
        </Card>
      )}
    </div>
  );
}
