"use client";

import { useEffect, useMemo } from "react";
import {
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Button,
  Space,
} from "antd";
import {
  ThunderboltOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  TeamOutlined,
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
  UserOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useDashboardTestStore } from "@/stores/dashboardTestStore";

const { Text, Title } = Typography;

const getNum = (item, field) =>
  Number(item?.[field]?.value ?? item?.[field] ?? 0);

const metricDefs = [
  {
    icon: <ThunderboltOutlined />,
    title: "Отключено ТП",
    field: "TP_ALL",
    color: "#faad14",
  },
  {
    icon: <EnvironmentOutlined />,
    title: "Отключено ЛЭП 6-20 кВ",
    field: "LINESN_ALL",
    color: "#52c41a",
  },
  {
    icon: <HomeOutlined />,
    title: "Населённых пунктов",
    custom: (tns) =>
      new Set(tns.map((i) => i.DISTRICT?.value || i.DISTRICT).filter(Boolean))
        .size,
    color: "#1890ff",
  },
  {
    icon: <TeamOutlined />,
    title: "Население",
    field: "POPULATION_COUNT",
    color: "#722ed1",
  },
  {
    icon: <ApartmentOutlined />,
    title: "МКД",
    field: "MKD_ALL",
    color: "#fa541c",
  },
  {
    icon: <BankOutlined />,
    title: "Частные дома",
    field: "PRIVATE_HOUSE_ALL",
    color: "#fa8c16",
  },
  { icon: <ShopOutlined />, title: "СНТ", field: "SNT_ALL", color: "#52c41a" },
  {
    icon: <FireOutlined />,
    title: "Котельных",
    field: "BOILER_ALL",
    color: "#eb2f96",
  },
  {
    icon: <DashboardOutlined />,
    title: "ЦТП",
    field: "CTP_ALL",
    color: "#13c2c2",
  },
  {
    icon: <ExperimentOutlined />,
    title: "ВЗУ",
    field: "WELLS_ALL",
    color: "#722ed1",
  },
  { icon: <BuildOutlined />, title: "КНС", field: "KNS_ALL", color: "#faad14" },
  {
    icon: <MedicineBoxOutlined />,
    title: "Больниц",
    field: "HOSPITALS_ALL",
    color: "#1890ff",
  },
  {
    icon: <MedicineBoxOutlined />,
    title: "Поликлиник",
    field: "CLINICS_ALL",
    color: "#722ed1",
  },
  {
    icon: <ReadOutlined />,
    title: "Школ",
    field: "SCHOOLS_ALL",
    color: "#52c41a",
  },
  {
    icon: <SmileOutlined />,
    title: "Детских садов",
    field: "KINDERGARTENS_ALL",
    color: "#fa541c",
  },
];

const statDefs = [
  {
    icon: <TeamOutlined />,
    title: "Бригады",
    field: "BRIGADECOUNT",
    color: "#722ed1",
  },
  {
    icon: <UserOutlined />,
    title: "Люди",
    field: "EMPLOYEECOUNT",
    color: "#13c2c2",
  },
  {
    icon: <ToolOutlined />,
    title: "Техника",
    field: "SPECIALTECHNIQUECOUNT",
    color: "#eb2f96",
  },
  {
    icon: <ThunderboltOutlined />,
    title: "ПЭС",
    field: "PES_COUNT",
    color: "#faad14",
  },
];

/* ------------------------------------------------ component -------- */

export default function DashboardTest() {
  const { data: session, status } = useSession();
  const token = session?.user?.jwt ?? null;

  const { uniqueOpen, isLoading, error, loadUnique } = useDashboardTestStore();

  useEffect(() => {
    if (status === "authenticated") loadUnique(token);
  }, [status, token, loadUnique]);

  /* агрегаты по метрикам */
  const metrics = useMemo(() => {
    if (!uniqueOpen?.length) return [];
    return metricDefs.map((m) => ({
      ...m,
      value:
        typeof m.custom === "function"
          ? m.custom(uniqueOpen)
          : uniqueOpen.reduce((s, i) => s + getNum(i, m.field), 0),
    }));
  }, [uniqueOpen]);

  const stats = useMemo(() => {
    if (!uniqueOpen?.length) return [];
    return statDefs.map((s) => ({
      ...s,
      value: uniqueOpen.reduce((sum, i) => sum + getNum(i, s.field), 0),
    }));
  }, [uniqueOpen]);

  /* текущее время (Москва) */
  const currentDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date()),
    []
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* ----- Header ----- */}
      <Title
        level={2}
        style={{
          textAlign: "center",
          color: "#1575bc",
          fontWeight: "bold",
          letterSpacing: 0.5,
          marginBottom: 8,
          userSelect: "none",
        }}
      >
        ТЕХНОЛОГИЧЕСКИЕ НАРУШЕНИЯ В ЭЛЕКТРИЧЕСКИХ СЕТЯХ АО «МОСОБЛЭНЕРГО»
      </Title>
      <Text
        style={{
          display: "block",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: 18,
          color: "#1575bc",
          marginBottom: 40,
          userSelect: "none",
          letterSpacing: 0.5,
        }}
      >
        По состоянию на {currentDateTime}
      </Text>

      {/* ----- Loading / Error ----- */}
      {isLoading && !error && (
        <Space style={{ width: "100%", justifyContent: "center" }}>
          <Spin size="large" />
        </Space>
      )}

      {error && (
        <Title level={4} type="danger" style={{ textAlign: "center" }}>
          {error}
        </Title>
      )}

      {!isLoading && !error && uniqueOpen && (
        <>
          {/* ----- BIG “Всего” card ----- */}
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} sm={12} md={10} lg={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  background: "#e6f4ff",
                  textAlign: "center",
                }}
                bodyStyle={{ padding: 24 }}
              >
                <Statistic
                  title={<Text strong>Всего</Text>}
                  value={uniqueOpen.length}
                  valueStyle={{
                    fontSize: 48,
                    color: "#1575bc",
                    fontWeight: 700,
                  }}
                  suffix="ТН"
                />
                <Button
                  type="primary"
                  size="large"
                  style={{ marginTop: 24, borderRadius: 8 }}
                  onClick={() =>
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    })
                  }
                >
                  подробно
                </Button>
              </Card>
            </Col>

            {/* ----- Metrics cards ----- */}
            {metrics.map(({ icon, title, value, color }) => (
              <Col
                key={title}
                xs={12}
                sm={8}
                md={6}
                lg={4}
                xl={3}
                style={{ display: "flex" }}
              >
                <Card
                  bordered={false}
                  hoverable
                  style={{ width: "100%", borderRadius: 12 }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space align="start">
                    <span style={{ fontSize: 24, color }}>{icon}</span>
                    <Statistic
                      title={<span style={{ fontSize: 12 }}>{title}</span>}
                      value={value}
                      valueStyle={{ fontSize: 20, fontWeight: 600, color }}
                    />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ----- Resources section ----- */}
          <Card
            style={{
              marginTop: 48,
              borderRadius: 16,
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: 32 }}
          >
            <Title level={4} style={{ textAlign: "center", marginBottom: 32 }}>
              Задействовано сил и средств Мособлэнерго
            </Title>

            <Row gutter={[24, 24]} justify="center">
              {stats.map(({ icon, title, value, color }) => (
                <Col
                  key={title}
                  xs={12}
                  sm={8}
                  md={6}
                  lg={4}
                  style={{ display: "flex" }}
                >
                  <Card
                    bordered={false}
                    hoverable
                    style={{ width: "100%", borderRadius: 12 }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <Space align="start">
                      <span style={{ fontSize: 24, color }}>{icon}</span>
                      <Statistic
                        title={<span style={{ fontSize: 12 }}>{title}</span>}
                        value={value}
                        valueStyle={{ fontSize: 20, fontWeight: 600, color }}
                      />
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </>
      )}
    </div>
  );
}
