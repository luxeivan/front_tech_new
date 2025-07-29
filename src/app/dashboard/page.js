"use client";
import React, { useEffect } from "react";
import { Suspense } from "react";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import { Card, Row, Col, Spin} from "antd";
import { useTnsDataStore } from "../../stores/tnsDataStore";
import { useDashboardStore } from "../../stores/dashboardStore";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";

function formatNumber(val) {
  if (typeof val !== "number") return "—";
  return val.toLocaleString("ru-RU");
}

const MetricCard = ({ icon, title, value, color, filterField, onClick }) => (
  <Card
    style={{
      borderRadius: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      minHeight: 108,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "0 0 0 0",
      cursor: filterField ? "pointer" : "default",
    }}
    styles={{ body: { padding: "16px 22px" } }}
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
      styles={{ body: { padding: "16px 20px" } }}
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

  const filterField = useDashboardStore((s) => s.filterField);
  const minValue = useDashboardStore((s) => s.minValue);
  const applyFilter = useDashboardStore((s) => s.applyFilter);
  const tnCoords = useDashboardStore((s) => s.tnCoords);
  const loadCoordsFromTns = useDashboardStore((s) => s.loadCoordsFromTns);
  const metrics = useDashboardStore((s) => s.metrics);
  const stats = useDashboardStore((s) => s.stats);
  const outages = useDashboardStore((s) => s.outages);

  useEffect(() => {
    if (token) fetchTns(token);
  }, [token, fetchTns]);

  // Подтягиваем координаты через стор
  useEffect(() => {
    loadCoordsFromTns(tns);
  }, [tns, loadCoordsFromTns]);

  // Считываем параметры фильтра из URL
  useEffect(() => {
    const filter = searchParams.get("filter");
    const minStr = searchParams.get("min");
    const min = minStr !== null ? Number(minStr) : null;
    applyFilter(filter, min, tns);
  }, [searchParams, tns, applyFilter]);

  // Функция для обновления параметров фильтра в URL
  const updateFilter = (field) => {
    if (!field) {
      router.push("/");
      applyFilter(null, null, tns);
      return;
    }
    if (field === "DISTRICT") {
      router.push("/?filter=DISTRICT&min=1");
      applyFilter("DISTRICT", 1, tns);
      return;
    }
    const min = 1;
    router.push(`/?filter=${field}&min=${min}`);
    applyFilter(field, min, tns);
  };

  // Пересчитать фильтрацию / агрегаты при первом получении tns
  useEffect(() => {
    if (tns && tns.length) {
      applyFilter(filterField, minValue, tns);
    }
  }, [tns]); // eslint-disable-line react-hooks/exhaustive-deps


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
      {loading || !tns ? (
        <div style={{ display: "flex", justifyContent: "center", margin: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
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
            ТЕХНОЛОГИЧЕСКИЕ НАРУШЕНИЯ В ЭЛЕКТРИЧЕСКИХ СЕТЯХ АО «МОСОБЛЭНЕРГО»
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
            gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}
            justify="center"
            align="top"
            style={{
              marginBottom: 24,
              flexWrap: "wrap",
              width: "100%",
              padding: "0 8px",
            }}
          >
            <Col
              xs={24}
              sm={24}
              md={12}
              lg={8}
              xl={7}
              style={{
                width: "100%",
                maxWidth: 500,
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
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "center",
                }}
              >
                <MetricCard
                  {...m}
                  filterField={m.filterField}
                  onClick={updateFilter}
                />
              </Col>
            ))}
          </Row>

          {/* Карта (на всю ширину) */}
          <div
            style={{
              width: "100%",
              borderRadius: 18,
              minHeight: 400,
              overflow: "hidden",
              marginBottom: 38,
            }}
          >
            <YMaps>
              <Map
                defaultState={{
                  center: [55.753215, 37.622504],
                  zoom: 8,
                  controls: ["zoomControl"],
                }}
                width="100%"
                height={400}
                options={{
                  suppressMapOpenBlock: true,
                  yandexMapDisablePoiInteractivity: true,
                }}
                modules={["control.ZoomControl"]}
              >
                {/* --- Здесь отображаем Placemark для каждой tnCoords с popup/label --- */}
                {tnCoords.map((p) =>
                  p.coords ? (
                    <Placemark
                      key={p.id}
                      geometry={p.coords}
                      properties={{
                        balloonContent: p.balloonContent || p.label,
                        hintContent: p.label,
                      }}
                      modules={["geoObject.addon.balloon", "geoObject.addon.hint"]}
                      options={{
                        openBalloonOnClick: true,
                        hideIconOnBalloonOpen: false,
                      }}
                    />
                  ) : null
                )}
              </Map>
            </YMaps>
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
            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 28 }} justify="center">
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
        </>
      )}
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
