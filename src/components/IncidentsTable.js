"use client";
import React from "react";
import {
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Card,
  Descriptions,
} from "antd";
import {
  CalendarOutlined,
  FieldTimeOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import SendDataControls from "./SendDataControls";

const { Title, Text } = Typography;

export default function IncidentsTable({
  dataSource, // подготовленный массив строк
  extractText, // utils-функция
  formatDate,
  formatTime,
  formatDateTime,
  onCloseIncident, // «Выполнена»
  onSendTelegram, // колбэк отправки
}) {
  /* ─── «Карточка» раскрытой строки ─── */
  const expandedRowRender = (record) => {
    const inc = record.incident;
    const a = inc.AddressInfo ?? {};
    const d = inc.DisruptionStats ?? {};

    /* Адрес в одну строку */
    const streetStr =
      (a.Street ?? []).map((s) => s.street_name).join(", ") || "—";

    return (
      <Card bordered={false} style={{ background: "#fafafa" }}>
        <Row gutter={[24, 24]}>
          {/* Левая колонка: краткие сведения */}
          <Col xs={24} md={12}>
            <Descriptions
              size="small"
              column={1}
              title={<Title level={5}>Общие сведения</Title>}
              items={[
                { label: "Статус", children: inc.status_incident || "—" },
                {
                  label: (
                    <>
                      <CalendarOutlined /> Дата начала
                    </>
                  ),
                  children: `${formatDate(inc.start_date)} ${formatTime(
                    inc.start_time
                  )}`,
                },
                inc.estimated_restoration_time && {
                  label: "Прогноз восстановления",
                  children: formatDateTime(inc.estimated_restoration_time),
                },
                inc.end_date &&
                  inc.end_time && {
                    label: (
                      <>
                        <FieldTimeOutlined /> Дата окончания
                      </>
                    ),
                    children: `${formatDate(inc.end_date)} ${formatTime(
                      inc.end_time
                    )}`,
                  },
              ].filter(Boolean)}
            />

            <Descriptions
              size="small"
              column={1}
              title={
                <Title level={5} style={{ marginTop: 16 }}>
                  Адрес
                </Title>
              }
              items={[
                {
                  label: <EnvironmentOutlined />,
                  children: (
                    <Space wrap>
                      <Tag color="blue">{a.city_name || "—"}</Tag>
                      <Text>{streetStr}</Text>
                    </Space>
                  ),
                },
                {
                  label: "Тип поселения",
                  children: a.settlement_type || "—",
                },
                {
                  label: "Тип застройки",
                  children: a.building_type || "—",
                },
              ]}
            />
          </Col>

          {/* Правая колонка: статистика + кнопки отправки */}
          <Col xs={24} md={12}>
            <Descriptions
              size="small"
              column={1}
              title={<Title level={5}>Статистика отключения</Title>}
              items={[
                {
                  label: "Нас. пунктов",
                  children: d.affected_settlements ?? 0,
                },
                { label: "Жителей", children: d.affected_residents ?? 0 },
                { label: "МКД", children: d.affected_mkd ?? 0 },
                { label: "Больниц", children: d.affected_hospitals ?? 0 },
                { label: "Поликлиник", children: d.affected_clinics ?? 0 },
                { label: "Школ", children: d.affected_schools ?? 0 },
                { label: "Детсадов", children: d.affected_kindergartens ?? 0 },
                {
                  label: "Бойлерных / котельн",
                  children: d.boiler_shutdown ?? 0,
                },
              ]}
            />

            <SendDataControls incident={inc} onSendTelegram={onSendTelegram} />
          </Col>

          {/* Описание внизу на всю ширину */}
          <Col span={24}>
            <Title level={5} style={{ marginTop: 16 }}>
              Описание
            </Title>
            <Text>{extractText(inc.description)}</Text>

            {inc.closure_description && (
              <>
                <Title level={5} style={{ marginTop: 16 }}>
                  Описание закрытия
                </Title>
                <Text>{extractText(inc.closure_description)}</Text>
              </>
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  /* ─── колонки таблицы ─── */
  const columns = [
    {
      title: "Город",
      dataIndex: "cityName",
      sorter: (a, b) => a.cityName.localeCompare(b.cityName),
    },
    {
      title: "Улицы",
      dataIndex: "streets",
      ellipsis: true,
    },
    {
      title: "Начало",
      dataIndex: "startDateTime",
      sorter: (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    },
    {
      title: "Окончание",
      dataIndex: "endDateTime",
      render: (val, rec) =>
        rec.status_incident?.trim() === "выполнена" ? val : "—",
    },
    { title: "Прогноз (ч)", dataIndex: "restHours" },
    {
      title: "Действие",
      render: (_, rec) =>
        rec.status_incident?.trim() === "в работе" && (
          <Button
            size="small"
            type="link"
            onClick={() => onCloseIncident(rec.incident.documentId)}
          >
            Завершить
          </Button>
        ),
    },
  ];

  /* ─── подчёркивание строк ─── */
  const rowClassName = (r) =>
    r.status_incident?.trim() === "в работе" ? "active-row" : "completed-row";

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      expandable={{ expandedRowRender }}
      rowClassName={rowClassName}
    />
  );
}
