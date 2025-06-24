"use client";
import React from "react";
import { Table, Button, Typography } from "antd";
import SendDataControls from "./SendDataControls";

const { Title, Text } = Typography;

export default function IncidentsTable({
  dataSource, // массив данных, уже отфильтрованный / отсортированный
  extractText, // функция извлечения текста (useIncidentsUtilsStore)
  formatDate, // форматирование даты
  formatTime, // форматирование времени
  formatDateTime, // форматирование даты-времени
  onCloseIncident, // кол-бэк «Выполнена»
  onSendTelegram, // кол-бэк «Отправить в TG»
}) {
  /* ─────────────── развернутая строка ─────────────── */
  const expandedRowRender = (record) => {
    const incident = record.incident;

    const cityName = incident.AddressInfo?.city_name ?? "нет";
    const streetsArr = incident.AddressInfo?.Street ?? [];
    const streets = streetsArr.length
      ? streetsArr.map((s) => s.street_name).join(", ")
      : "нет";

    return (
      <div style={{ background: "#fafafa", padding: 16 }}>
        {/* ─── Основная информация ─── */}
        <Title level={5}>Основная информация</Title>
        <p>
          <strong>Статус:</strong> {incident.status_incident ?? "нет"}
        </p>
        <p>
          <strong>Дата начала:</strong> {formatDate(incident.start_date)}{" "}
          {formatTime(incident.start_time)}
        </p>
        <p>
          <strong>Прогноз восстановления:</strong>{" "}
          {incident.estimated_restoration_time
            ? formatDateTime(incident.estimated_restoration_time)
            : "нет"}
        </p>
        {incident.end_date && incident.end_time && (
          <p>
            <strong>Дата окончания:</strong> {formatDate(incident.end_date)}{" "}
            {formatTime(incident.end_time)}
          </p>
        )}

        {/* ─── Описание ─── */}
        <Title level={5}>Описание</Title>
        <Text>{extractText(incident.description)}</Text>

        {incident.closure_description && (
          <>
            <Title level={5} style={{ marginTop: 16 }}>
              Описание закрытия
            </Title>
            <Text>{extractText(incident.closure_description)}</Text>
          </>
        )}

        {/* ─── Адресная информация ─── */}
        {incident.AddressInfo && (
          <>
            <Title level={5} style={{ marginTop: 16 }}>
              Адресная информация
            </Title>
            <p>
              <strong>Тип поселения:</strong>{" "}
              {incident.AddressInfo.settlement_type ?? "нет"}
            </p>
            <p>
              <strong>Город:</strong> {cityName}
            </p>
            <p>
              <strong>Улицы:</strong> {streets}
            </p>
            <p>
              <strong>Тип застройки:</strong>{" "}
              {incident.AddressInfo.building_type ?? "нет"}
            </p>
          </>
        )}

        {/* ─── Статистика отключения ─── */}
        {incident.DisruptionStats && (
          <>
            <Title level={5} style={{ marginTop: 16 }}>
              Статистика отключения
            </Title>
            <p>
              <strong>Отключено населенных пунктов:</strong>{" "}
              {incident.DisruptionStats.affected_settlements ?? 0}
            </p>
            <p>
              <strong>Отключено жителей:</strong>{" "}
              {incident.DisruptionStats.affected_residents ?? 0}
            </p>
            <p>
              <strong>Отключено МКД:</strong>{" "}
              {incident.DisruptionStats.affected_mkd ?? 0}
            </p>
            <p>
              <strong>Отключено больниц:</strong>{" "}
              {incident.DisruptionStats.affected_hospitals ?? 0}
            </p>
            <p>
              <strong>Отключено поликлиник:</strong>{" "}
              {incident.DisruptionStats.affected_clinics ?? 0}
            </p>
            <p>
              <strong>Отключено школ:</strong>{" "}
              {incident.DisruptionStats.affected_schools ?? 0}
            </p>
            <p>
              <strong>Отключено детсадов:</strong>{" "}
              {incident.DisruptionStats.affected_kindergartens ?? 0}
            </p>
            <p>
              <strong>Отключено бойлерных/котельн:</strong>{" "}
              {incident.DisruptionStats.boiler_shutdown ?? 0}
            </p>
          </>
        )}

        {/* ─── Отправка данных ─── */}
        <SendDataControls incident={incident} onSendTelegram={onSendTelegram} />
      </div>
    );
  };

  /* ─────────────── колонки таблицы ─────────────── */
  const columns = [
    {
      title: "Городской округ",
      dataIndex: "cityName",
      key: "cityName",
      sorter: (a, b) => a.cityName.localeCompare(b.cityName),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Улицы",
      dataIndex: "streets",
      key: "streets",
      sorter: (a, b) => a.streets.localeCompare(b.streets),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Дата и время отключения",
      dataIndex: "startDateTime",
      key: "startDateTime",
      sorter: (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Дата окончания",
      dataIndex: "endDateTime",
      key: "endDateTime",
      render: (text, r) =>
        r.status_incident?.trim() === "выполнена" ? text : "-",
    },
    {
      title: "Прогнозируемое время включения (ч)",
      dataIndex: "restHours",
      key: "restHours",
    },
    {
      title: "Действие",
      key: "action",
      render: (_, r) =>
        r.status_incident?.trim() === "в работе" && (
          <Button onClick={() => onCloseIncident(r.incident.documentId)}>
            Выполнена
          </Button>
        ),
    },
  ];

  /* ─────────────── стили строк ─────────────── */
  const rowClassName = (record) =>
    record.status_incident?.trim() === "в работе"
      ? "active-row"
      : "completed-row";

  /* ─────────────── JSX ─────────────── */
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
