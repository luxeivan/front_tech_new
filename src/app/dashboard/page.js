"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Suspense } from "react";
import { Card, Row, Col, Spin, Table, Button } from "antd";
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
import { useRouter, useSearchParams } from "next/navigation";

function formatNumber(val) {
  if (typeof val !== "number") return "—";
  return val.toLocaleString("ru-RU");
}

// Карточка для метрики
const MetricCard = ({ icon, title, value, color, filterField, onClick }) => (
  <Card
    style={{
      borderRadius: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      minHeight: 108,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "0 0 0 0",
      cursor: filterField ? "pointer" : "default",
    }}
    bodyStyle={{ padding: "16px 22px" }}
    hoverable={!!filterField}
    onClick={() => {
      if (filterField) {
        console.log("[DEBUG] MetricCard clicked filter:", filterField);
        onClick(filterField);
      }
    }}
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
      </div>
    </div>
  </Card>
);

// Основная карточка с количеством всех отключений, уменьшенная и выделенная
const MainMetricCard = ({ value, onClick }) => {
  // Применяем уменьшение размера шрифта для очень больших чисел (больше 6 цифр)
  const valueStr =
    typeof value === "number" && !isNaN(value) && value !== 0
      ? formatNumber(value)
      : "—";
  const isLargeNumber = valueStr.replace(/\D/g, "").length > 6;
  const fontSizeNumber = isLargeNumber ? 36 : 53;

  return (
    <Card
      style={{
        borderRadius: 18,
        boxShadow: "0 8px 24px rgba(21,117,188,0.23)",
        minHeight: 155,
        minWidth: 253,
        maxWidth: 347,
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
        cursor: "pointer",
      }}
      hoverable
      bodyStyle={{ padding: "16px 20px" }}
      onClick={() => {
        console.log("[DEBUG] MainMetricCard clicked filter: none");
        onClick(null);
      }}
    >
      <div
        style={{
          fontWeight: 600,
          color: "#1575bc",
          fontSize: 24,
          marginBottom: 4,
          letterSpacing: 0.5,
        }}
      >
        Всего
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          width: "100%",
          marginBottom: 4,
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
            fontSize: 18,
            fontWeight: 800,
            color: "#1575bc",
            marginLeft: 10,
            marginBottom: 4,
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
        onClick={() => {
          console.log("[DEBUG] MainMetricCard button clicked: reset filters");
          onClick(null);
        }}
      >
        подробно
      </button>
    </Card>
  );
};

function Dashboard() {
  const tns = useTnsDataStore((state) => state.tns);
  const loading = useTnsDataStore((state) => state.loading);
  const fetchTns = useTnsDataStore((state) => state.fetchTns);
  const { data: session } = useSession();
  const token = session?.user?.jwt;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [filterField, setFilterField] = useState(null);
  const [minValue, setMinValue] = useState(null);

  useEffect(() => {
    if (token) fetchTns(token);
  }, [token, fetchTns]);

  // Считываем параметры фильтра из URL
  useEffect(() => {
    const filter = searchParams.get("filter");
    const min = searchParams.get("min");
    setFilterField(filter);
    setMinValue(min !== null ? Number(min) : null);
  }, [searchParams]);

  // Функция для обновления параметров фильтра в URL
  const updateFilter = (field) => {
    if (!field) {
      // Сброс фильтра
      router.push(window.location.pathname);
      setFilterField(null);
      setMinValue(null);
      return;
    }
    const min = 1;
    router.push(`/?filter=${field}&min=${min}`);
    setFilterField(field);
    setMinValue(min);
  };

  // Фильтрация данных по фильтру и минимальному значению
  const filteredTns = useMemo(() => {
    if (!filterField) return tns;

    console.log("[DEBUG]", filterField, "all values:", tns.map((t) => t[filterField]?.value));

    if (filterField === "DISTRICT") {
      // Фильтрация по населенным пунктам - показываем только те, у которых есть непустое значение DISTRICT
      return tns.filter((item) => Boolean(item.DISTRICT?.value));
    }

    // Для всех остальных фильтров фильтруем по числовому значению >= minValue
    if (minValue === null || isNaN(minValue)) return tns;

    return tns.filter((item) => {
      const val = item[filterField]?.value;
      if (val === undefined || val === null) return false;
      const numVal = Number(val);
      if (isNaN(numVal)) return false;
      return numVal >= minValue;
    });
  }, [tns, filterField, minValue]);

  if (loading || !tns) {
    return (
      <div style={{ display: "flex", justifyContent: "center", margin: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Массив для единого рендера: [{icon, title, value, color, filterField}]
  const metrics = [
    {
      icon: <ThunderboltOutlined />,
      title: "Отключено ТП",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.TP_ALL?.value) || 0),
        0
      ),
      color: "#faad14",
      filterField: "TP_ALL",
    },
    {
      icon: <EnvironmentOutlined />,
      title: "Отключено ЛЭП 6-20 кВ (шт.)",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.LINESN_ALL?.value) || 0),
        0
      ),
      color: "#52c41a",
      filterField: "LINESN_ALL",
    },
    {
      icon: <HomeOutlined />,
      title: "Населённых пунктов",
      value: new Set(tns.map((item) => item.DISTRICT?.value).filter(Boolean))
        .size,
      color: "#1890ff",
      filterField: "DISTRICT",
    },
    {
      icon: <TeamOutlined />,
      title: "Население",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.POPULATION_COUNT?.value) || 0),
        0
      ),
      color: "#722ed1",
      filterField: "POPULATION_COUNT",
    },
    {
      icon: <ApartmentOutlined />,
      title: "МКД",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.MKD_ALL?.value) || 0),
        0
      ),
      color: "#fa541c",
      filterField: "MKD_ALL",
    },
    {
      icon: <BankOutlined />,
      title: "Частные дома",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.PRIVATE_HOUSE_ALL?.value) || 0),
        0
      ),
      color: "#fa8c16",
      filterField: "PRIVATE_HOUSE_ALL",
    },
    {
      icon: <ShopOutlined />,
      title: "СНТ",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.SNT_ALL?.value) || 0),
        0
      ),
      color: "#52c41a",
      filterField: "SNT_ALL",
    },
    {
      icon: <FireOutlined />,
      title: "Котельных",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.BOILER_ALL?.value) || 0),
        0
      ),
      color: "#eb2f96",
      filterField: "BOILER_ALL",
    },
    {
      icon: <DashboardOutlined />,
      title: "ЦТП",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.CTP_ALL?.value) || 0),
        0
      ),
      color: "#13c2c2",
      filterField: "CTP_ALL",
    },
    {
      icon: <ExperimentOutlined />,
      title: "ВЗУ",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.WELLS_ALL?.value) || 0),
        0
      ),
      color: "#722ed1",
      filterField: "WELLS_ALL",
    },
    {
      icon: <BuildOutlined />,
      title: "КНС",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.KNS_ALL?.value) || 0),
        0
      ),
      color: "#faad14",
      filterField: "KNS_ALL",
    },
    {
      icon: <MedicineBoxOutlined />,
      title: "Больниц",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.HOSPITALS_ALL?.value) || 0),
        0
      ),
      color: "#1890ff",
      filterField: "HOSPITALS_ALL",
    },
    {
      icon: <MedicineBoxOutlined />,
      title: "Поликлиник",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.CLINICS_ALL?.value) || 0),
        0
      ),
      color: "#722ed1",
      filterField: "CLINICS_ALL",
    },
    {
      icon: <ReadOutlined />,
      title: "Школ",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.SCHOOLS_ALL?.value) || 0),
        0
      ),
      color: "#52c41a",
      filterField: "SCHOOLS_ALL",
    },
    {
      icon: <SmileOutlined />,
      title: "Детских садов",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.KINDERGARTENS_ALL?.value) || 0),
        0
      ),
      color: "#fa541c",
      filterField: "KINDERGARTENS_ALL",
    },
  ];

  // "Задействовано сил и средств"
  const stats = [
    {
      icon: <TeamOutlined />,
      title: "Бригады",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.BRIGADECOUNT?.value) || 0),
        0
      ),
      color: "#722ed1",
    },
    {
      icon: <UserOutlined />,
      title: "Люди",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.EMPLOYEECOUNT?.value) || 0),
        0
      ),
      color: "#13c2c2",
    },
    {
      icon: <ToolOutlined />,
      title: "Техника",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.SPECIALTECHNIQUECOUNT?.value) || 0),
        0
      ),
      color: "#eb2f96",
    },
    {
      icon: <ThunderboltOutlined />,
      title: "ПЭС",
      value: tns.reduce(
        (sum, item) => sum + (Number(item.PES_COUNT?.value) || 0),
        0
      ),
      color: "#faad14",
    },
  ];

  // "Всего отключений"
  const outages = tns.length;
  const currentDateTime = dayjs().format("DD.MM.YYYY HH:mm");

  // Табличные колонки для отображения filteredTns (пример)
  const columns = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      render: (_, record) => record.NAME?.value || "—",
    },
    {
      title: "Населённый пункт",
      dataIndex: "district",
      key: "district",
      render: (_, record) => record.DISTRICT?.value || "—",
    },
    {
      title: "ТП",
      dataIndex: "tp_all",
      key: "tp_all",
      render: (_, record) =>
        record.TP_ALL?.value !== undefined ? record.TP_ALL.value : "—",
    },
    // Добавьте другие колонки по необходимости
  ];

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
          marginBottom: 16,
          color: "#1575bc",
          fontWeight: "bold",
          fontSize: 32,
          userSelect: "none",
          letterSpacing: 0.5,
        }}
      >
        АВАРИЙНЫЕ ОТКЛЮЧЕНИЯ В ЭЛЕКТРИЧЕСКИХ СЕТЯХ АО «МОСОБЛЭНЕРГО»
      </h2>
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: 20,
          marginBottom: 40,
          color: "#1575bc",
          userSelect: "none",
          letterSpacing: 0.5,
        }}
      >
        По состоянию на {currentDateTime}
      </div>
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
          <MainMetricCard value={outages} onClick={updateFilter} />
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
            <MetricCard {...m} filterField={m.filterField} onClick={updateFilter} />
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

export default function Page() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <Dashboard />
    </Suspense>
  );
}
