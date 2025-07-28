"use client";
import React, { useEffect } from "react";
import { Card, Row, Col, Spin, Button } from "antd";
import {
  ThunderboltOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ToolOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  BankOutlined,
  ShopOutlined,
  FireOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  BuildOutlined,
  MedicineBoxOutlined,
  ReadOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useTnsDataStore } from "../../stores/tnsDataStore";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";

function formatNumber(val) {
  if (typeof val !== "number") return "—";
  return val.toLocaleString("ru-RU");
}

// Карточка для метрики
const MetricCard = ({ icon, title, value, color, showButton }) => (
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
          {typeof value === "number" && !isNaN(value) && value !== 0
            ? formatNumber(value)
            : "—"}
        </div>
        {showButton && (
          <Button
            type="primary"
            style={{
              marginTop: 8,
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 15,
              padding: "4px 14px",
              cursor: "pointer",
              transition: "background .17s",
            }}
            onClick={() => (window.location.href = "/")}
          >
            подробно
          </Button>
        )}
      </div>
    </div>
  </Card>
);

// Основная карточка с количеством всех отключений, увеличенная и выделенная
const MainMetricCard = ({ value, currentDateTime }) => {
  // Применяем уменьшение размера шрифта для очень больших чисел (больше 6 цифр)
  const valueStr = typeof value === "number" && !isNaN(value) && value !== 0 ? formatNumber(value) : "—";
  const isLargeNumber = valueStr.replace(/\D/g, '').length > 6;
  const fontSizeNumber = isLargeNumber ? 54 : 80;

  return (
    <Card
      style={{
        borderRadius: 28,
        boxShadow: "0 8px 24px rgba(21,117,188,0.23)",
        minHeight: 230,
        minWidth: 380,
        maxWidth: 520,
        width: "100%",
        border: "3px solid #1575bc",
        background: "rgba(21,117,188,0.07)",
        marginBottom: 12,
        marginTop: -10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
      }}
      hoverable
      bodyStyle={{ padding: "24px 28px" }}
    >
      <div
        style={{
          fontWeight: 700,
          color: "#1575bc",
          fontSize: 20,
          marginBottom: 5,
          letterSpacing: 0.1,
        }}
      >
        По состоянию на
      </div>
      <div
        style={{
          fontWeight: 600,
          color: "#1a1a1a",
          fontSize: 20,
          marginBottom: 16,
        }}
      >
        {currentDateTime}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          width: "100%",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: fontSizeNumber,
            fontWeight: 800,
            color: "#1575bc",
            lineHeight: 1.05,
            wordBreak: "break-word",
            maxWidth: 360,
            overflowWrap: "break-word",
            userSelect: "text",
            letterSpacing: 2,
          }}
          title={valueStr}
        >
          {valueStr}
        </span>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#1575bc",
            marginLeft: 14,
            marginBottom: 7,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          ТН
        </span>
      </div>
      <button
        style={{
          marginTop: 2,
          borderRadius: 7,
          background: "#1677ff",
          color: "#fff",
          fontWeight: 600,
          border: "none",
          fontSize: 18,
          padding: "10px 26px",
          cursor: "pointer",
          transition: "background .17s",
          userSelect: "none",
        }}
        onClick={() => (window.location.href = "/")}
      >
        подробно
      </button>
    </Card>
  );
};

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
        (sum, item) => sum + (Number(item.TP_ALL?.value) || 0),
        0
      ),
      color: "#faad14",
      showButton: true,
    },
    {
      icon: <EnvironmentOutlined />,
      title: "Отключено ЛЭП 6-20 кВ (шт.)",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.LINESN_ALL?.value) || 0),
        0
      ),
      color: "#52c41a",
      showButton: true,
    },
    {
      icon: <HomeOutlined />,
      title: "Населённых пунктов",
      value: new Set(
        tns.map((item) => item.DISTRICT?.value).filter(Boolean)
      ).size,
      color: "#1890ff",
      showButton: true,
    },
    {
      icon: <TeamOutlined />,
      title: "Население",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.POPULATION_COUNT?.value) || 0),
        0
      ),
      color: "#722ed1",
      showButton: true,
    },
    {
      icon: <ApartmentOutlined />,
      title: "МКД",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.MKD_ALL?.value) || 0),
        0
      ),
      color: "#fa541c",
      showButton: true,
    },
    {
      icon: <BankOutlined />,
      title: "Частные дома",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.PRIVATE_HOUSE_ALL?.value) || 0),
        0
      ),
      color: "#fa8c16",
      showButton: true,
    },
    {
      icon: <ShopOutlined />,
      title: "СНТ",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.SNT_ALL?.value) || 0),
        0
      ),
      color: "#52c41a",
      showButton: true,
    },
    {
      icon: <FireOutlined />,
      title: "Котельных",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.BOILER_ALL?.value) || 0),
        0
      ),
      color: "#eb2f96",
      showButton: true,
    },
    {
      icon: <DashboardOutlined />,
      title: "ЦТП",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.CTP_ALL?.value) || 0),
        0
      ),
      color: "#13c2c2",
      showButton: true,
    },
    {
      icon: <ExperimentOutlined />,
      title: "ВЗУ",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.WELLS_ALL?.value) || 0),
        0
      ),
      color: "#722ed1",
      showButton: true,
    },
    {
      icon: <BuildOutlined />,
      title: "КНС",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.KNS_ALL?.value) || 0),
        0
      ),
      color: "#faad14",
      showButton: true,
    },
    {
      icon: <MedicineBoxOutlined />,
      title: "Больниц",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.HOSPITALS_ALL?.value) || 0),
        0
      ),
      color: "#1890ff",
      showButton: true,
    },
    {
      icon: <MedicineBoxOutlined />,
      title: "Поликлиник",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.CLINICS_ALL?.value) || 0),
        0
      ),
      color: "#722ed1",
      showButton: true,
    },
    {
      icon: <ReadOutlined />,
      title: "Школ",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.SCHOOLS_ALL?.value) || 0),
        0
      ),
      color: "#52c41a",
      showButton: true,
    },
    {
      icon: <SmileOutlined />,
      title: "Детских садов",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.KINDERGARTENS_ALL?.value) || 0),
        0
      ),
      color: "#fa541c",
      showButton: true,
    },
  ];

  // "Задействовано сил и средств"
  const stats = [
    {
      icon: <TeamOutlined />,
      title: "Бригады",
      value: tns.reduce((sum, item) => sum + (Number(item.BRIGADECOUNT?.value) || 0), 0),
      color: "#722ed1",
    },
    {
      icon: <UserOutlined />,
      title: "Люди",
      value: tns.reduce((sum, item) => sum + (Number(item.EMPLOYEECOUNT?.value) || 0), 0),
      color: "#13c2c2",
    },
    {
      icon: <ToolOutlined />,
      title: "Техника",
      value: tns.reduce((sum, item) => sum + (Number(item.SPECIALTECHNIQUECOUNT?.value) || 0), 0),
      color: "#eb2f96",
    },
    {
      icon: <ThunderboltOutlined />,
      title: "ПЭС",
      value: tns.reduce((sum, item) => sum + (Number(item.PES_COUNT?.value) || 0), 0),
      color: "#faad14",
    },
  ];

  // "Всего отключений"
  const outages = tns.length;
  const currentDateTime = dayjs().format("DD.MM.YYYY HH:mm");

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
      {/* Основные метрики — Grid из карточек */}
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
          sm={24}
          md={12}
          lg={8}
          xl={7}
          style={{
            minWidth: 340,
            maxWidth: 500,
            marginRight: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MainMetricCard value={outages} currentDateTime={currentDateTime} />
        </Col>
        {metrics.map((m) => (
          <Col
            key={m.title}
            xs={24}
            sm={12}
            md={8}
            lg={6}
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
          {stats.map((s) => (
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
