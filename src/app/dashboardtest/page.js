"use client";

/* --------------------------------------------------------------
 *  src/app/dashboardtest/page.js
 *  UI-страница: сводка по «уникальным открытым» (Ant Design)
 * --------------------------------------------------------------*/

import { useEffect, useMemo } from "react";
import { Typography, Spin, Card, Row, Col, Statistic } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useDashboardTestStore } from "@/stores/dashboardTestStore";

const { Title } = Typography;

export default function DashboardTest() {
  const { data: session, status } = useSession();
  const token = session?.user?.jwt ?? null;

  const { uniqueOpen, isLoading, error, loadUnique } = useDashboardTestStore();

  /* загружаем данные после авторизации */
  useEffect(() => {
    if (status === "authenticated") loadUnique(token);
  }, [status, token, loadUnique]);

  /* «текущее время» в Москве (пересчёт 1 раз за рендер) */
  const currentDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date()),
    []
  );

  /* ---------------- UI ---------------- */
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 24,
        gap: 32,
      }}
    >
      {/* --- Заголовок --- */}
      <h2
        style={{
          textAlign: "center",
          marginBottom: 0,
          color: "#1575bc",
          fontWeight: "bold",
          fontSize: 32,
          userSelect: "none",
          letterSpacing: 0.5,
        }}
      >
        ТЕХНОЛОГИЧЕСКИЕ НАРУШЕНИЯ В ЭЛЕКТРИЧЕСКИХ СЕТЯХ АО «МОСОБЛЭНЕРГО»
      </h2>

      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: 20,
          color: "#1575bc",
          userSelect: "none",
          letterSpacing: 0.5,
        }}
      >
        По состоянию на {currentDateTime}
      </div>

      {/* --- Контент --- */}
      {isLoading && !error && <Spin size="large" />}

      {!isLoading && !error && (
        <Row gutter={[24, 24]} justify="center" style={{ width: "100%" }}>
          <Col xs={24} sm={18} md={12} lg={8}>
            <Card
              hoverable
              style={{
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <Statistic
                title="Всего уникальных ТН"
                value={uniqueOpen.length}
                valueStyle={{ color: "#1575bc", fontWeight: 700 }}
                prefix={<ThunderboltOutlined />}
                suffix="шт."
              />
            </Card>
          </Col>
        </Row>
      )}

      {error && (
        <Title level={4} type="danger" style={{ marginTop: 24 }}>
          {error}
        </Title>
      )}
    </div>
  );
}
