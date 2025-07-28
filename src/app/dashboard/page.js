"use client";
import React, { useEffect } from "react";
import { Card, Row, Col, Spin } from "antd";
import {
  ThunderboltOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ToolOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useTnsDataStore } from "../../stores/tnsDataStore";
import { useSession } from "next-auth/react";

function formatNumber(val) {
  if (typeof val !== "number") return "—";
  return val.toLocaleString("ru-RU");
}

// Карточка для метрики
const MetricCard = ({ icon, title, value, color }) => (
  <Card
    style={{
      borderRadius: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      minHeight: 108,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "0 0 0 0",
    }}
    bodyStyle={{ padding: "16px 22px" }}
    hoverable
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          fontSize: 34,
          color: color,
          background: `${color}22`,
          borderRadius: 8,
          width: 54,
          height: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: "#404040",
            letterSpacing: 0.2,
            marginBottom: 6,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#1575bc",
            letterSpacing: 1,
            lineHeight: 1,
          }}
        >
          {value !== undefined && value !== null && value !== 0
            ? formatNumber(value)
            : "—"}
        </div>
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const tns = useTnsDataStore((state) => state.tns);
  const loading = useTnsDataStore((state) => state.loading);
  const fetchTns = useTnsDataStore((state) => state.fetchTns);
  const { data: session } = useSession();
  const token = session?.user?.jwt;

  useEffect(() => {
    if (token) fetchTns(token);
  }, [token, fetchTns]);

  if (loading || !tns) {
    return (
      <div style={{ display: "flex", justifyContent: "center", margin: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Массив для единого рендера: [{icon, title, value, color}]
  const metrics = [
    {
      icon: <ThunderboltOutlined />,
      title: "Отключено ТП",
      value: tns.reduce(
        (sum, item) =>
          sum + ((item.TP_SECTION?.value || 0) + (item.TP_ALL?.value || 0)),
        0
      ),
      color: "#faad14",
    },
    {
      icon: <EnvironmentOutlined />,
      title: "Отключено ЛЭП 6-10 кВ",
      value: tns.reduce((sum, item) => sum + (item.lep?.value || 0), 0),
      color: "#52c41a",
    },
    {
      icon: <HomeOutlined />,
      title: "Населённых пунктов",
      value: tns.reduce((sum, item) => sum + (item.towns?.value || 0), 0),
      color: "#1890ff",
    },
    {
      icon: <TeamOutlined />,
      title: "Население",
      value: tns.reduce(
        (sum, item) => sum + (item.POPULATION_COUNT?.value || 0),
        0
      ),
      color: "#722ed1",
    },
    {
      icon: <HomeOutlined />,
      title: "МКД",
      value: tns.reduce((sum, item) => sum + (item.mcd?.value || 0), 0),
      color: "#1890ff",
    },
    {
      icon: <UserOutlined />,
      title: "Частных домов",
      value: tns.reduce((sum, item) => sum + (item.houses?.value || 0), 0),
      color: "#13c2c2",
    },
    {
      icon: <EnvironmentOutlined />,
      title: "СНТ",
      value: tns.reduce((sum, item) => sum + (item.snt?.value || 0), 0),
      color: "#52c41a",
    },
    {
      icon: <ToolOutlined />,
      title: "Котельных",
      value: tns.reduce((sum, item) => sum + (item.boiler?.value || 0), 0),
      color: "#eb2f96",
    },
  ];

  // "Задействовано сил и средств"
  const stats = [
    {
      icon: <TeamOutlined />,
      title: "Бригады",
      value: tns.reduce((sum, item) => sum + (item.teams?.value || 0), 0),
      color: "#722ed1",
    },
    {
      icon: <UserOutlined />,
      title: "Люди",
      value: tns.reduce((sum, item) => sum + (item.people?.value || 0), 0),
      color: "#13c2c2",
    },
    {
      icon: <ToolOutlined />,
      title: "Техника",
      value: tns.reduce((sum, item) => sum + (item.vehicles?.value || 0), 0),
      color: "#eb2f96",
    },
    {
      icon: <ThunderboltOutlined />,
      title: "ПЭС",
      value: tns.reduce((sum, item) => sum + (item.pes?.value || 0), 0),
      color: "#faad14",
    },
  ];

  // "Всего отключений"
  const outages = tns.length;

  return (
    <div
      style={{
        width: "90vw",
        minHeight: "100vh",
        margin: "0 auto",
        padding: "40px 0 48px 0",
        maxWidth: "100vw",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: 40,
          color: "#1575bc",
          fontWeight: "bold",
          fontSize: 32,
          userSelect: "none",
          letterSpacing: 0.5,
        }}
      >
        АВАРИЙНЫЕ ОТКЛЮЧЕНИЯ В ЭЛЕКТРИЧЕСКИХ СЕТЯХ АО «МОСОБЛЭНЕРГО»
      </h2>
      {/* Основные метрики — Grid из 8 карточек */}
      <Row
        gutter={[32, 32]}
        justify="center"
        align="middle"
        style={{
          marginBottom: 36,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <Col
          xs={24}
          sm={12}
          md={8}
          lg={5}
          xl={4}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 14px rgba(21,117,188,0.10)",
              textAlign: "center",
              userSelect: "none",
              height: 138,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
            hoverable
          >
            <div
              style={{
                fontSize: 58,
                fontWeight: "bold",
                color: "#1575bc",
                marginBottom: 12,
                lineHeight: 1.1,
                userSelect: "text",
              }}
            >
              {formatNumber(outages)}
            </div>
            <button
              style={{
                marginTop: 4,
                borderRadius: 7,
                background: "#1677ff",
                color: "#fff",
                fontWeight: 600,
                border: "none",
                fontSize: 15,
                padding: "8px 18px",
                cursor: "pointer",
                transition: "background .17s",
              }}
              onClick={() => (window.location.href = "/")}
            >
              подробно
            </button>
          </Card>
        </Col>
        {metrics.map((m, idx) => (
          <Col
            key={m.title}
            xs={24}
            sm={12}
            md={8}
            lg={5}
            xl={4}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              justifyContent: "center",
            }}
          >
            <MetricCard {...m} />
          </Col>
        ))}
      </Row>

      {/* Карта (на всю ширину) */}
      <div
        style={{
          width: "100%",
          background: "#f3f7fa",
          borderRadius: 18,
          minHeight: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 38,
        }}
      >
        <div style={{ textAlign: "center", color: "#b6b6b6" }}>
          <EnvironmentOutlined style={{ fontSize: 64, marginBottom: 18 }} />
          <div style={{ fontSize: 19, fontWeight: 500, opacity: 0.85 }}>
            [Карта в разработке]
          </div>
        </div>
      </div>

      {/* Задействовано сил и средств */}
      <Card
        style={{
          borderRadius: 18,
          boxShadow: "0 4px 14px rgba(21,117,188,0.08)",
          padding: "30px 20px",
          width: "100%",
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            marginBottom: 20,
            textAlign: "center",
            color: "#232323",
            letterSpacing: 0.5,
          }}
        >
          Задействовано сил и средств Мособлэнерго
        </div>
        <Row gutter={[28, 28]} justify="space-around">
          {stats.map((s, i) => (
            <Col
              key={s.title}
              xs={24}
              sm={12}
              md={6}
              lg={6}
              xl={6}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "center",
              }}
            >
              <MetricCard {...s} />
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
