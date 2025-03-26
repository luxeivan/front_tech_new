"use client";
import React, { useEffect, useState } from "react";
import {
  Spin,
  Alert,
  Typography,
  Button,
  Space,
  Pagination,
  message,
  DatePicker,
  ConfigProvider,
} from "antd";

import ru_RU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/ru";
import ExcelJS from "exceljs";

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.locale("ru");

import Link from "next/link";

import useAuthStore from "@/stores/authStore";
import { useIncidentsUtilsStore } from "@/stores/incidentsUtilsStore";
import { useIncidentsDataStore } from "@/stores/incidentsDataStore";
import IncidentsTable from "../IncidentsTable";

// Модалки
import NewIncidentModal from "./NewIncidentModal";
import CloseIncidentModal from "./CloseIncidentModal";
import { ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function MainContent() {
  const { token } = useAuthStore();

  // Забираем состояния и метод загрузки из zustand
  const { incidents, loading, error, fetchIncidents } = useIncidentsDataStore();

  // Модалки
  const [newModalVisible, setNewModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [currentIncidentId, setCurrentIncidentId] = useState(null);

  // Фильтр по статусу: "all", "active", "completed"
  const [filter, setFilter] = useState("all");

  // Изначально null, чтобы на сервере не было динамической даты
  const [dateRange, setDateRange] = useState(null);

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Форматирующие функции из стора
  const { extractText, formatTime, formatDate, formatDateTime } =
    useIncidentsUtilsStore();

  // Загружаем инциденты при появлении токена
  useEffect(() => {
    if (token) {
      fetchIncidents(token);
    }
  }, [token, fetchIncidents]);

  useEffect(() => {
    // Только на клиенте выставляем "сегодня — сегодня"
    setDateRange([dayjs(), dayjs()]);
  }, []);

  //Автообнова каждые 30сек
  useEffect(() => {
    if (!token) return;
    if (newModalVisible || closeModalVisible) return;

    const intervalId = setInterval(() => {
      fetchIncidents(token);
    }, 120000);

    return () => clearInterval(intervalId);
  }, [token, fetchIncidents, newModalVisible, closeModalVisible]);

  // Если идёт загрузка
  // if (loading) {
  //   return (
  //     <div style={{ textAlign: "center", marginTop: 50 }}>
  //       <Spin size="large" />
  //     </div>
  //   );
  // }

  // Если ошибка
  if (error) {
    return (
      <div style={{ marginTop: 50 }}>
        <Alert type="error" message={error} />
      </div>
    );
  }

  // Фильтруем по статусу
  let filteredIncidents = [];
  if (filter === "all") {
    filteredIncidents = incidents;
  } else if (filter === "active") {
    filteredIncidents = incidents.filter(
      (item) => item.status_incident?.trim() === "в работе"
    );
  } else if (filter === "completed") {
    filteredIncidents = incidents.filter(
      (item) => item.status_incident?.trim() === "выполнена"
    );
  }

  // Фильтрация по периоду
  if (dateRange && dateRange[0] && dateRange[1]) {
    const [start, end] = dateRange;
    filteredIncidents = filteredIncidents.filter((incident) => {
      const incidentDate = dayjs(incident.start_date, "YYYY-MM-DD");
      return incidentDate.isBetween(start, end, "day", "[]");
    });
  }

  // Сортировка от новых к старым
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const dateA = dayjs(
      `${a.start_date}T${a.start_time}`,
      "YYYY-MM-DDTHH:mm:ss.SSS"
    );
    const dateB = dayjs(
      `${b.start_date}T${b.start_time}`,
      "YYYY-MM-DDTHH:mm:ss.SSS"
    );
    return dateB.valueOf() - dateA.valueOf();
  });

  // Пагинация
  const totalCount = sortedIncidents.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageIncidents = sortedIncidents.slice(startIndex, endIndex);

  // Готовим dataSource для IncidentsTable
  const dataSource = pageIncidents.map((incident) => {
    const cityName = incident.AddressInfo?.city_district?.name || "Неизвестно";
    const streets = incident.AddressInfo?.streets || "-";

    const startDateTime = `${formatDate(incident.start_date)} ${formatTime(
      incident.start_time
    )}`;

    const endDate = incident.end_date ? formatDate(incident.end_date) : "-";
    const endTime = incident.end_time ? formatTime(incident.end_time) : "-";

    // Подсчёт часов до восстановления
    let restHours = "";
    if (incident.estimated_restoration_time) {
      const start = dayjs(`${incident.start_date}T${incident.start_time}`);
      const est = dayjs(incident.estimated_restoration_time);
      const diff = est.diff(start, "hour");
      restHours = diff >= 0 ? diff : 0;
    }

    return {
      key: incident.id,
      incident,
      cityName,
      streets,
      startDateTime,
      endDateTime: `${endDate} ${endTime}`,
      restHours,
      status_incident: incident.status_incident,
      documentId: incident.documentId,
    };
  });

  // Коллбэк, когда пользователь нажал "Выполнена" в таблице
  const handleCloseIncident = (documentId) => {
    setCurrentIncidentId(documentId);
    setCloseModalVisible(true);
  };

  // Функция экспорта
  async function handleExportExcel() {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Incidents");

      // Задаём заголовки столбцов
      sheet.columns = [
        { header: "Город", key: "cityName", width: 20 },
        { header: "Улицы", key: "streets", width: 30 },
        { header: "Дата начала", key: "startDateTime", width: 20 },
        { header: "Дата окончания", key: "endDateTime", width: 20 },
        { header: "Статус", key: "status_incident", width: 15 },
        { header: "Прогноз (ч)", key: "restHours", width: 15 },
      ];

      // Заполняем строки
      dataSource.forEach((item) => {
        sheet.addRow({
          cityName: item.cityName,
          streets: item.streets,
          startDateTime: item.startDateTime,
          endDateTime: item.endDateTime,
          status_incident: item.status_incident,
          restHours: item.restHours,
        });
      });

      // Генерируем файл как Blob
      const buffer = await workbook.xlsx.writeBuffer();
      // Скачиваем (пример для браузера)
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "incidents.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
    }
  }

  // Вычисляем сводные показатели на основе filteredIncidents
  const activeIncidentsCount = filteredIncidents.filter(
    (item) => item.status_incident?.trim() === "в работе"
  ).length;

  const totalAffectedResidents = filteredIncidents.reduce((sum, item) => {
    const residents = item.DisruptionStats?.affected_residents || "0";
    return sum + parseInt(residents, 10);
  }, 0);

  return (
    <ConfigProvider locale={ru_RU}>
      <div style={{ padding: 20 }}>
        {/* Шапка с заголовком, кнопками "Новое ТН" и "Статистика" */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 15,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Технологические нарушения
          </Title>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button type="primary" onClick={() => setNewModalVisible(true)}>
              Новое ТН
            </Button>

            <Button onClick={handleExportExcel}>Экспорт в Excel</Button>

            {/* Кнопка для перехода на страницу статистики */}
            <Link href="/stat">
              <Button>Статистика</Button>
            </Link>
          </div>
        </div>

        {/* Блок фильтров */}
        <div
          style={{
            marginBottom: 15,
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Space.Compact>
            <Button
              type={filter === "all" ? "primary" : "default"}
              onClick={() => {
                setFilter("all");
                setCurrentPage(1);
              }}
            >
              Все ТН
            </Button>
            <Button
              type={filter === "active" ? "primary" : "default"}
              onClick={() => {
                setFilter("active");
                setCurrentPage(1);
              }}
            >
              В работе
            </Button>
            <Button
              type={filter === "completed" ? "primary" : "default"}
              onClick={() => {
                setFilter("completed");
                setCurrentPage(1);
              }}
            >
              Выполненные
            </Button>
          </Space.Compact>

          <RangePicker
            format="DD.MM.YYYY"
            value={dateRange || []} // Если null, передаём пустой массив
            onChange={(dates) => {
              setDateRange(dates);
              setCurrentPage(1);
            }}
            allowClear
          />
          <ReloadOutlined onClick={() => { fetchIncidents(token) }} style={{ cursor: "pointer" }} />
        </div>
        {loading &&
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <Spin size="large" />
          </div>
        }
        {!loading &&
          <>
            <div
              style={{
                marginBottom: 20,
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#f0f5ff",
              }}
            >
              <Typography.Text strong>
                Активных инцидентов: {activeIncidentsCount}
              </Typography.Text>
              <br />
            </div>

            {/* Тут используем нашу отдельную таблицу */}
            <IncidentsTable
              dataSource={dataSource}
              extractText={extractText}
              formatDate={formatDate}
              formatTime={formatTime}
              formatDateTime={formatDateTime}
              onCloseIncident={handleCloseIncident}
            />

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Pagination
                current={currentPage}
                total={totalCount}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
              />
            </div>

            <NewIncidentModal
              visible={newModalVisible}
              onCancel={() => {
                setNewModalVisible(false);
                fetchIncidents(token); // после закрытия можем обновить список
              }}
            />
            <CloseIncidentModal
              visible={closeModalVisible}
              incidentId={currentIncidentId}
              onCancel={() => setCloseModalVisible(false)}
              onSuccess={() => {
                setCloseModalVisible(false);
                message.success("ТН переведена в статус 'Выполнена'!");
                // Обновляем список
                fetchIncidents(token);
              }}
            />

          </>
        }
        <style jsx global>{`
          .active-row {
            background-color: #fff1f0 !important;
          }
          .completed-row {
            background-color: #f6ffed !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
