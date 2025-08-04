"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  Spin,
  Alert,
  Typography,
  Button,
  Pagination,
  Select,
  ConfigProvider,
  Space,
  Descriptions,
  message,
} from "antd";
import ru_RU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import {
  ReloadOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ApartmentOutlined,
  UserOutlined,
  FieldNumberOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import AiButton from "../client/mainContent/AiButton";
import SendPart from "../client/mainContent/sendPart";
import SaveModal from "../client/global/SaveModal";
import { useTnsDataStore, useTnFilters } from "@/stores/tnsDataStore";
import { useMainContentStore } from "@/stores/mainContentStore";
import { useGlobalStore } from "@/stores/globalStore";
import { groupFields } from "./GroupFields";
import SoInfo from "./SoInfo";

const { Title } = Typography;
dayjs.locale("ru");

// ─── иконки для Descriptions ──────────────────────────
const iconMap = {
  CREATE_USER: <UserOutlined style={{ marginRight: 4 }} />,
  F81_010_NUMBER: <FieldNumberOutlined style={{ marginRight: 4 }} />,
  SCNAME: <ApartmentOutlined style={{ marginRight: 4 }} />,
  OWN_SCNAME: <ApartmentOutlined style={{ marginRight: 4 }} />,
  STATUS_NAME: <InfoCircleOutlined style={{ marginRight: 4 }} />,
};

export default function MainContent() {
  // ───── URL-параметры ────────────────────────────────
  const searchParams = useSearchParams();
  const filterField = searchParams.get("filter");
  const minValue = searchParams.get("min");

  // ───── Auth ─────────────────────────────────────────
  const { data: session } = useSession();
  const token = session?.user?.jwt;

  // ───── Загрузка данных (Zustand) ────────────────────
  const { tns, loading, error, fetchTns, updateField } = useTnsDataStore();

  // ───── Глобальный стор ──────────────────────────────
  const modalOpen = useGlobalStore((s) => s.modalOpen);
  const setModalOpen = useGlobalStore((s) => s.setModalOpen);
  const refreshInterval = useGlobalStore((s) => s.refreshInterval);

  // ───── Пагинация (Zustand) ──────────────────────────
  const page = useMainContentStore((s) => s.page);
  const setPage = useMainContentStore((s) => s.setPage);
  const pageSize = useMainContentStore((s) => s.pageSize);
  const setPageSize = useMainContentStore((s) => s.setPageSize);

  // ───── Модалка редактирования (Zustand) ─────────────
  const editing = useMainContentStore((s) => s.editing);
  const editValue = useMainContentStore((s) => s.editValue);
  const openEditStore = useMainContentStore((s) => s.openEdit);
  const setEditValue = useMainContentStore((s) => s.setEditValue);
  const closeEdit = useMainContentStore((s) => s.closeEdit);

  // ───── Состояние: какие строки раскрыты ─────────────
  const [expandedKeys, setExpandedKeys] = useState([]);

  // ───── Первичная загрузка ───────────────────────────
  useEffect(() => {
    if (token) fetchTns(token);
  }, [token, fetchTns]);

  // ───── Авто-обновление (пауза: модалка **или** раскрыта строка) ──
  useEffect(() => {
    if (!token || modalOpen || expandedKeys.length) return;
    const id = setInterval(() => fetchTns(token), refreshInterval);
    return () => clearInterval(id);
  }, [token, fetchTns, modalOpen, refreshInterval, expandedKeys]);

  // ───── Звуковое уведомление о новых ТН ───────────────
  const prevIds = useRef([]);
  useEffect(() => {
    if (prevIds.current.length) {
      const newIds = tns
        .map((t) => t.id)
        .filter((id) => !prevIds.current.includes(id));
      if (newIds.length) new Audio("/sounds/sound.mp3").play().catch(() => {});
    }
    prevIds.current = tns.map((t) => t.id);
  }, [tns]);

  // ───── Фильтрация по URL (filter/min) ────────────────
  let filteredTnsByField = tns;
  if (filterField) {
    if (filterField === "DISTRICT") {
      filteredTnsByField = tns.filter((t) => t[filterField]?.value?.trim());
    } else {
      const min = minValue !== null ? Number(minValue) : 1;
      filteredTnsByField = tns.filter(
        (t) => Number(t[filterField]?.value) >= min
      );
    }
  }

  // ───── Селекты-фильтры ──────────────────────────────
  const { filterableFields, filters, setFilterValue, filteredTns } =
    useTnFilters(filteredTnsByField);

  // ───── Сортировка + пагинация ───────────────────────
  const sortedTns = useMemo(() => {
    const getTime = (t) =>
      dayjs(
        t.F81_060_EVENTDATETIME?.value ||
          t.CREATE_DATETIME?.value ||
          t.createdAt
      ).valueOf() || 0;
    return [...filteredTns].sort((a, b) => getTime(b) - getTime(a));
  }, [filteredTns]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTns.slice(start, start + pageSize);
  }, [sortedTns, page, pageSize]);

  // сброс страницы при смене фильтра
  useEffect(() => setPage(1), [filterField, minValue, filters]);

  // ───── Открыть редактор поля ─────────────────────────
  const openEdit = (tnId, docId, fieldKey, label, value) => {
    openEditStore({ tnId, docId, fieldKey, label, value });
    setModalOpen(true);
  };

  // ───── Сохранить поле ────────────────────────────────
  const saveEdit = async () => {
    if (!editing) return;
    const { tnId, docId, fieldKey } = editing;
    const newVal = editValue?.trim();
    updateField(tnId, fieldKey, newVal);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${docId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          body: JSON.stringify({ data: { [fieldKey]: { value: newVal } } }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Поле обновлено");
    } catch (e) {
      console.error(e);
      message.error("Не удалось сохранить на сервере");
    } finally {
      closeEdit();
      setModalOpen(false);
    }
  };

  // ───── Таблица: данные и колонки ─────────────────────
  const dataSource = paginatedRows.map((item) => ({
    key: item.id,
    raw: item,
    number: item.F81_010_NUMBER?.value ?? "—",
    prodDept: item.SCNAME?.value ?? "—",
    branch: item.OWN_SCNAME?.value ?? "—",
    objectN: item.F81_041_ENERGOOBJECTNAME?.value ?? "—",
    address: item.ADDRESS_LIST?.value ?? "—",
    dispCenter: item.DISPCENTER_NAME_?.value ?? "—",
    status: item.STATUS_NAME?.value ?? "—",
    eventDate: item.F81_060_EVENTDATETIME?.value
      ? dayjs(item.F81_060_EVENTDATETIME.value).format("DD.MM.YYYY HH:mm")
      : "—",
  }));

  const columns = [
    { title: "№ ТН", dataIndex: "number", key: "number" },
    { title: "Объект", dataIndex: "objectN", key: "objectN" },
    { title: "Адреса", dataIndex: "address", key: "address" },
    { title: "Дисп. центр", dataIndex: "dispCenter", key: "dispCenter" },
    { title: "Статус", dataIndex: "status", key: "status" },
    { title: "Дата/время", dataIndex: "eventDate", key: "eventDate" },
  ];

  // ───── Expanded row ─────────────────────────────────
  const expandedRowRender = (record) => {
    const { main, dateStatus, outageConsumer, resources, others } = groupFields(
      record.raw
    );

    const renderDesc = (fields) =>
      fields.map(([key, v], idx) => {
        const zebra = idx % 2 ? "#fafafa" : undefined;
        const editable = v.edit === "Да";
        return {
          key,
          label: (
            <>
              {iconMap[key]}
              {v.label}
            </>
          ),
          children: (
            <>
              {String(
                typeof v.value === "object" ? JSON.stringify(v.value) : v.value
              )}
              {editable && (
                <EditOutlined
                  style={{ marginLeft: 8, cursor: "pointer", color: "#389e0d" }}
                  onClick={() =>
                    openEdit(
                      record.raw.id,
                      record.raw.documentId,
                      key,
                      v.label,
                      v.value
                    )
                  }
                />
              )}
            </>
          ),
          labelStyle: { background: editable ? "#f6ffed" : zebra },
          contentStyle: { background: editable ? "#f6ffed" : zebra },
        };
      });

    const tabsItems = [
      {
        key: "main",
        label: "Основное",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(main)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
      {
        key: "dateStatus",
        label: "Даты и статусы",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(dateStatus)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
      {
        key: "outageConsumer",
        label: "Отключения и потребители",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(outageConsumer)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
      {
        key: "resources",
        label: "Потребности и ресурсы",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(resources)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
      {
        key: "so",
        label: "Социальные объекты",
        children: <SoInfo tnId={record.raw.id} docId={record.raw.documentId} />,
      },
      {
        key: "others",
        label: "Прочее",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(others)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
    ];

    return (
      <SendPart
        record={record}
        updateField={updateField}
        tabsItems={tabsItems}
      />
    );
  };

  // ───── Render ───────────────────────────────────────
  const router = useRouter();
  const clearFilters = () => {
    filterableFields.forEach((k) => setFilterValue(k, "Все"));
    setPage(1);
    router.replace("/dashboard");
  };

  return (
    <ConfigProvider locale={ru_RU}>
      <div style={{ padding: 20 }}>
        {/* Заголовок + action-кнопки */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Технологические&nbsp;нарушения
          </Title>
          <Space>
            <Button color="green" variant="solid" onClick={clearFilters}>
              Дашборд
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => token && fetchTns(token)}
            >
              Обновить
            </Button>
            <Button danger onClick={clearFilters}>
              Сбросить фильтры
            </Button>
            <AiButton />
          </Space>
        </div>

        {/* Селекты-фильтры */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {filterableFields.map((key) => {
            const values = Array.from(
              new Set(tns.map((t) => t[key]?.value).filter(Boolean))
            );
            const label = tns.find((t) => t[key])?.[key]?.label ?? key;
            return (
              <Select
                key={key}
                value={filters[key] ?? "Все"}
                style={{ width: 220 }}
                onChange={(val) => {
                  setFilterValue(key, val);
                  if (filterField || minValue) router.replace("/dashboard");
                  setPage(1);
                }}
                options={[
                  { value: "Все", label: `${label}: Все` },
                  ...values.map((v) => ({ value: v, label: v })),
                ]}
              />
            );
          })}
        </div>

        {/* Таблица / спиннер / ошибки */}
        {error && (
          <Alert type="error" message={error} style={{ marginBottom: 16 }} />
        )}
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              bordered
              size="middle"
              rowKey="key"
              expandable={{
                expandedRowRender,
                expandedRowKeys: expandedKeys,
                onExpandedRowsChange: setExpandedKeys,
              }}
            />
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Pagination
                current={page}
                total={sortedTns.length}
                pageSize={pageSize}
                showSizeChanger
                pageSizeOptions={[10, 25, 50, 100]}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Модалка редактирования */}
      <SaveModal
        editing={editing}
        editValue={editValue}
        setEditValue={setEditValue}
        onSave={saveEdit}
        onCancel={() => {
          closeEdit();
          setModalOpen(false);
        }}
      />
    </ConfigProvider>
  );
}
