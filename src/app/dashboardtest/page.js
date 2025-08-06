"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Button,
  Space,
  Skeleton,
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

const { Title, Text } = Typography;

/* -------- helpers -------- */
const n = (v) => (Number.isFinite(+v) ? +v : 0);
const f = (o, k) => n(o?.[k]?.value ?? o?.[k]);

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
    custom: (arr) =>
      new Set(arr.map((i) => i.DISTRICT?.value ?? i.DISTRICT).filter(Boolean))
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

/* ---------- component ---------- */
export default function DashboardTest() {
  const { data: session, status } = useSession();
  const token = session?.user?.jwt ?? null;
  const router = useRouter();

  const { uniqueOpen, isLoading, error, loadUnique } = useDashboardTestStore();

  // Load data when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      loadUnique(token);
    }
  }, [status, token, loadUnique]);

  // Current time for header
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(
      new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date())
    );
  }, []);

  // Metrics and stats
  const metrics = useMemo(() => {
    if (!uniqueOpen?.length) return [];
    return metricDefs.map((m) => ({
      ...m,
      value:
        typeof m.custom === "function"
          ? m.custom(uniqueOpen)
          : uniqueOpen.reduce((s, i) => s + f(i, m.field), 0),
    }));
  }, [uniqueOpen]);

  const stats = useMemo(() => {
    if (!uniqueOpen?.length) return [];
    return statDefs.map((s) => ({
      ...s,
      value: uniqueOpen.reduce((sum, i) => sum + f(i, s.field), 0),
    }));
  }, [uniqueOpen]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  if (status === "unauthenticated") {
    return null;
  }

  /* ---------- UI ---------- */
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <Title
        level={2}
        style={{ textAlign: "center", color: "#1575bc", fontWeight: 700 }}
      >
        ТЕХНОЛОГИЧЕСКИЕ НАРУШЕНИЯ В ЭЛЕКТРИЧЕСКИХ СЕТЯХ АО «МОСОБЛЭНЕРГО»
      </Title>
      {now ? (
        <Text
          style={{
            display: "block",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 20,
            color: "#1575bc",
            marginBottom: 48,
          }}
        >
          По состоянию на {now}
        </Text>
      ) : (
        <Skeleton
          paragraph={false}
          active
          style={{ width: 260, margin: "0 auto 48px" }}
        />
      )}

      {/* loader / error */}
      {isLoading && !error && (
        <Space
          style={{ width: "100%", justifyContent: "center", marginTop: 80 }}
        >
          <Spin size="large" tip="Загружаем данные…" />
        </Space>
      )}
      {error && (
        <Title level={4} type="danger" style={{ textAlign: "center" }}>
          {error}
        </Title>
      )}

      {!isLoading && !error && uniqueOpen && (
        <>
          {/* big card row */}
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} sm={24} md={12}>
              <Card
                variant="filled"
                style={{
                  borderRadius: 20,
                  background: "#e9f4ff",
                  textAlign: "center",
                }}
                styles={{ body: { padding: 40 } }}
              >
                <Statistic
                  title={
                    <Text strong style={{ fontSize: 20 }}>
                      Всего
                    </Text>
                  }
                  value={uniqueOpen.length}
                  valueStyle={{
                    fontSize: 72,
                    color: "#1575bc",
                    fontWeight: 700,
                  }}
                  suffix={
                    <span style={{ fontSize: 32, marginLeft: 4 }}>ТН</span>
                  }
                />
                <Button
                  type="primary"
                  size="large"
                  style={{ marginTop: 40, borderRadius: 12, paddingInline: 48 }}
                  // onClick={() =>
                  //   window.scrollTo({
                  //     top: document.body.scrollHeight,
                  //     behavior: "smooth",
                  //   })
                  // }
                  onClick={() => router.push("/main")}
                >
                  подробно
                </Button>
              </Card>
            </Col>
          </Row>

          {/* uniform metrics grid (4-up ≥ lg) */}
          <Row gutter={[24, 24]} justify="center" style={{ marginTop: 32 }}>
            {metrics.map(({ icon, title, value, color }) => (
              <Col key={title} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Card
                  hoverable
                  variant="outlined"
                  style={{
                    borderRadius: 18,
                    height: "100%",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
                  }}
                  styles={{ body: { padding: 28 } }}
                >
                  <Space
                    direction="vertical"
                    align="center"
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    <span style={{ fontSize: 38, color }}>{icon}</span>
                    <Text style={{ fontSize: 14, color: "#8c8c8c" }}>
                      {title}
                    </Text>
                    <Text style={{ fontSize: 36, fontWeight: 600, color }}>
                      {value.toLocaleString("ru-RU")}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* resources block */}
          <Card
            variant="outlined"
            style={{
              marginTop: 64,
              borderRadius: 20,
              boxShadow: "0 8px 18px rgba(0,0,0,0.05)",
            }}
            styles={{ body: { padding: 40 } }}
          >
            <Title level={4} style={{ textAlign: "center", marginBottom: 40 }}>
              Задействовано сил и средств Мособлэнерго
            </Title>
            <Row gutter={[24, 24]} justify="center">
              {stats.map(({ icon, title, value, color }) => (
                <Col key={title} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    variant="outlined"
                    style={{
                      borderRadius: 18,
                      height: "100%",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
                    }}
                    styles={{ body: { padding: 28 } }}
                  >
                    <Space
                      direction="vertical"
                      align="center"
                      style={{ width: "100%", textAlign: "center" }}
                    >
                      <span style={{ fontSize: 38, color }}>{icon}</span>
                      <Text style={{ fontSize: 14, color: "#8c8c8c" }}>
                        {title}
                      </Text>
                      <Text style={{ fontSize: 36, fontWeight: 600, color }}>
                        {value.toLocaleString("ru-RU")}
                      </Text>
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
