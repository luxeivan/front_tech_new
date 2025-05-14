import React from "react";
import { Table, Button, Switch, Typography } from "antd";

const { Title, Text } = Typography;

export default function IncidentsTable({
  dataSource, // массив данных, уже отфильтрованный/отсортированный
  extractText, // функция извлечения текста (из useIncidentsUtilsStore)
  formatDate, // функция форматирования даты
  formatTime, // функция форматирования времени
  formatDateTime, // функция форматирования даты-времени
  onCloseIncident, // коллбэк, когда пользователь нажимает "Выполнена"
  onSendTelegram,
}) {
  const expandedRowRender = (record) => {
    const incident = record.incident;

    const cityName = incident.AddressInfo?.city_name || "нет";
    const streetsArr = incident.AddressInfo?.Street || [];
    const streets = streetsArr.length
      ? streetsArr.map((s) => s.street_name).join(", ")
      : "нет";

    return (
      <div style={{ background: "#fafafa", padding: 16 }}>
        <Title level={5}>Основная информация</Title>
        <p>
          <strong>Статус:</strong> {incident.status_incident || "нет"}
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

        {incident.AddressInfo && (
          <>
            <Title level={5} style={{ marginTop: 16 }}>
              Адресная информация
            </Title>
            <p>
              <strong>Тип поселения:</strong>{" "}
              {incident.AddressInfo.settlement_type || "нет"}
            </p>
            <p>
              <strong>Город:</strong> {cityName}
            </p>
            <p>
              <strong>Улицы:</strong> {streets}
            </p>
            <p>
              <strong>Тип застройки:</strong>{" "}
              {incident.AddressInfo.building_type || "нет"}
            </p>
          </>
        )}

        {incident.DisruptionStats && (
          <>
            <Title level={5} style={{ marginTop: 16 }}>
              Статистика отключения
            </Title>
            <p>
              <strong>Отключено населенных пунктов:</strong>{" "}
              {incident.DisruptionStats.affected_settlements || "0"}
            </p>
            <p>
              <strong>Отключено жителей:</strong>{" "}
              {incident.DisruptionStats.affected_residents || "0"}
            </p>
            <p>
              <strong>Отключено МКД:</strong>{" "}
              {incident.DisruptionStats.affected_mkd || "0"}
            </p>
            <p>
              <strong>Отключено больниц:</strong>{" "}
              {incident.DisruptionStats.affected_hospitals || "0"}
            </p>
            <p>
              <strong>Отключено поликлиник:</strong>{" "}
              {incident.DisruptionStats.affected_clinics || "0"}
            </p>
            <p>
              <strong>Отключено школ:</strong>{" "}
              {incident.DisruptionStats.affected_schools || "0"}
            </p>
            <p>
              <strong>Отключено детсадов:</strong>{" "}
              {incident.DisruptionStats.affected_kindergartens || "0"}
            </p>
            <p>
              <strong>Отключено бойлерных/котельн:</strong>{" "}
              {incident.DisruptionStats.boiler_shutdown || "0"}
            </p>
          </>
        )}

        <Title level={5} style={{ marginTop: 16 }}>
          Отправка данных
        </Title>
        {/* <p>
          <strong>Отправлено в Telegram:</strong>{" "}
          <Switch checked={!!incident.sent_to_telegram} disabled />
        </p> */}

        <p>
          <strong>Отправлено в Telegram:</strong>{" "}
          <Switch
            checked={!!incident.sent_to_telegram}
            disabled={!!incident.sent_to_telegram} // уже отправили → серый
            onChange={() => onSendTelegram(incident)} /*  ← click */
          />
        </p>

        <p>
          <strong>Отправлено в АРМ ЕДДС:</strong>{" "}
          <Switch checked={!!incident.sent_to_arm_edds} disabled />
        </p>
        <p>
          <strong>Отправлено на сайт Мособлэнерго:</strong>{" "}
          <Switch checked={!!incident.sent_to_moenergo} disabled />
        </p>
        <p>
          <strong>Отправлено на сайт Минэнерго:</strong>{" "}
          <Switch checked={!!incident.sent_to_minenergo} disabled />
        </p>
      </div>
    );
  };

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
      sorter: (a, b) => {
        const tA = new Date(a.startDateTime).getTime();
        const tB = new Date(b.startDateTime).getTime();
        return tA - tB;
      },
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Дата окончания",
      dataIndex: "endDateTime",
      key: "endDateTime",
      render: (text, record) =>
        record.status_incident?.trim() === "выполнена" ? text : "-",
    },
    {
      title: "Прогнозируемое время включения (ч)",
      dataIndex: "restHours",
      key: "restHours",
    },
    {
      title: "Действие",
      key: "action",
      render: (_, record) => {
        if (record.status_incident?.trim() === "в работе") {
          return (
            <Button
              type="default"
              onClick={() => onCloseIncident(record.documentId)}
            >
              Выполнена
            </Button>
          );
        }
        return null;
      },
    },
  ];

  // Функция подсветки строк
  const rowClassName = (record) =>
    record.status_incident?.trim() === "в работе"
      ? "active-row"
      : "completed-row";

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
