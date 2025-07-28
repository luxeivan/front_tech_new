// eslint-disable-next-line spaced-comment
"use client";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, useMemo, useRef } from "react";
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
  Divider,
  Modal,
  Input,
  message,
  Tabs,
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
import SendButtons from "../client/mainContent/SendButtons";
import AiButton from "../client/mainContent/AiButton";
import {
  useTnsDataStore,
  useTnFilters,
} from "@/stores/tnsDataStore";
dayjs.locale("ru");
const { Title } = Typography;

const iconMap = {
  CREATE_USER: <UserOutlined style={{ marginRight: 4 }} />,
  F81_010_NUMBER: <FieldNumberOutlined style={{ marginRight: 4 }} />,
  SCNAME: <ApartmentOutlined style={{ marginRight: 4 }} />,
  OWN_SCNAME: <ApartmentOutlined style={{ marginRight: 4 }} />,
  STATUS_NAME: <InfoCircleOutlined style={{ marginRight: 4 }} />,
};

const SoInfo = ({ tnId, docId }) => {
  const [docIds, setDocIds] = React.useState(null);
  const [details, setDetails] = React.useState({});
  const { data: session } = useSession();
  const token = session?.user?.jwt;

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${docId}?populate[SocialObjects][populate]=*`,
          { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
        );
        const json = await res.json();
        const list = Array.isArray(json?.data?.SocialObjects)
          ? json.data.SocialObjects.flatMap((c) =>
              Array.isArray(c.SocialObjects)
                ? c.SocialObjects.map((o) => o.documentId).filter(Boolean)
                : []
            )
          : [];

        if (!cancelled) {
          setDocIds(list);
          console.log(
            `Соц объекты для ТН ${tnId}:`,
            list.length ? `${list.length} → ${list.join(", ")}` : "нет"
          );
        }
      } catch (e) {
        console.error("Ошибка загрузки соц‑объектов (список)", e);
      }
      return () => {
        cancelled = true;
      };
    })();
  }, [tnId, docId, token]);

  React.useEffect(() => {
    if (!docIds) return;
    docIds.forEach(async (id) => {
      if (details[id] !== undefined) return;

      setDetails((p) => ({ ...p, [id]: null }));

      try {
        const url =
          `${process.env.NEXT_PUBLIC_STRAPI_URL}` +
          `/api/soczialnye-obekties?filters[documentId][$eq]=${id}&populate=*`;
        const res = await fetch(url, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        const json = await res.json();
        const so = json?.data?.[0] ?? undefined;

        setDetails((p) => ({ ...p, [id]: so }));
      } catch (e) {
        console.error("Ошибка загрузки соц‑объекта", id, e);
        setDetails((p) => ({ ...p, [id]: undefined }));
      }
    });
  }, [docIds, details, token]);

  if (!docIds || docIds.length === 0) return null;

  // ─── UI ───
  return (
    <>
      <Divider orientation="left" style={{ marginTop: 12 }}>
        Соц&nbsp;объекты ({docIds.length})
      </Divider>

      {docIds.map((id) => {
        const so = details[id];
        if (so === null)
          return (
            <div key={id} style={{ marginBottom: 8 }}>
              {id} &nbsp;— загрузка…
            </div>
          );
        if (so === undefined)
          return (
            <div key={id} style={{ marginBottom: 8, color: "#c41d7f" }}>
              {id} &nbsp;— не найден
            </div>
          );

        const fields = Object.entries(so).filter(
          ([, v]) => v && typeof v === "object" && "label" in v && v.value
        );

        return (
          <Descriptions
            key={id}
            size="small"
            bordered
            column={2}
            title={so.Name?.value || id}
            style={{ marginBottom: 12 }}
            items={fields.map(([k, v]) => ({
              key: k,
              label: v.label,
              children: String(v.value),
            }))}
          />
        );
      })}
    </>
  );
};

function groupFields(record) {
  const fields = Object.entries(record).filter(
    ([key, v]) =>
      // пропускаем “тех‑поля”, которые не должны отображаться
      !["OBJECTNAMEKEY", "SWITCHNAMEKEY", "PVS_RP116_10BR_F20"].includes(key) &&
      v &&
      typeof v === "object" &&
      "label" in v &&
      v.value !== undefined &&
      v.value !== null &&
      v.value !== ""
  );

  const mainKeys = new Set([
    "CREATE_USER",
    "fio_response_phone",
    "description",
    "F81_010_NUMBER",
    "VIOLATION_TYPE",
    "STATUS_NAME",
    "VIOLATION_GUID_STR",
    "SCNAME",
    "OWN_SCNAME",
    "DISPCENTER_NAME_",
  ]);
  const dateStatusKeys = new Set([
    "F81_060_EVENTDATETIME",
    "F81_070_RESTOR_SUPPLAYDATETIME",
    "CREATE_DATETIME",
    "F81_290_RECOVERYDATETIME",
  ]);

  // For "Отключения и потребители": keys containing "ALL" or "COUNT"
  // For "Потребности и ресурсы": explicit keys plus those containing need_ or _count

  const outageConsumerKeys = [];
  const resourceKeys = [];

  // Explicit keys for resources as per instruction
  const explicitResourceKeys = new Set([
    "BRIGADECOUNT",
    "EMPLOYEECOUNT",
    "SPECIALTECHNIQUECOUNT",
    "PES_COUNT",
    "need_brigade_count",
    "need_person_count",
    "need_equipment_count",
    "need_reserve_power_source_count",
  ]);

  // Prepare groups
  const main = [];
  const dateStatus = [];
  const outageConsumer = [];
  const resources = [];
  const others = [];

  fields.forEach(([key, v]) => {
    const val = v.value;
    const canEdit = v.edit === "Да";

    if (mainKeys.has(key)) {
      main.push([key, v]);
    } else if (dateStatusKeys.has(key)) {
      dateStatus.push([key, v]);
    } else if (key.includes("ALL") || key.includes("COUNT")) {
      // Check if explicit resource key or resource-like key
      if (
        explicitResourceKeys.has(key) ||
        key.toLowerCase().includes("need_") ||
        key.toLowerCase().includes("_count")
      ) {
        resources.push([key, v]);
      } else {
        outageConsumer.push([key, v]);
      }
    } else if (
      explicitResourceKeys.has(key) ||
      key.toLowerCase().includes("need_") ||
      key.toLowerCase().includes("_count")
    ) {
      resources.push([key, v]);
    } else {
      others.push([key, v]);
    }
  });

  // Sort each group alphabetically by key
  const sortByKey = (arr) => arr.sort((a, b) => a[0].localeCompare(b[0]));
  sortByKey(main);
  sortByKey(dateStatus);
  sortByKey(outageConsumer);
  sortByKey(resources);
  sortByKey(others);

  return {
    main,
    dateStatus,
    outageConsumer,
    resources,
    others,
  };
}

import { useRouter } from "next/navigation";

export default function MainContent() {
  // ──────────────────────── 1. AUTH & STORE ────────────────────────
  const searchParams = useSearchParams();
  const filterField = searchParams.get("filter");
  const minValue = searchParams.get("min");
  const { data: session } = useSession();
  const token = session?.user?.jwt;
  const { tns, loading, error, fetchTns, updateField } = useTnsDataStore();
  // --- фильтрация по фильтру из searchParams ---
  // --- фильтрация по фильтру из searchParams ---
  let filteredTnsByField = tns;
  if (filterField) {
    const min = minValue !== null ? Number(minValue) : 1;
    filteredTnsByField = tns.filter((t) => {
      const field = t[filterField];
      if (!field) return false; // пропуск, если поля нет вовсе
      const val = field.value;
      // Явно фильтруем только валидные значения
      if (typeof val === "number") {
        if (val === null || val === undefined || Number.isNaN(val))
          return false;
        return Number(val) >= min;
      }
      if (typeof val === "string") {
        return val.trim() !== "" && val !== "—";
      }
      return false;
    });
    // 👉 Добавляем вывод documentId только релевантных ТН
    const filteredIds = filteredTnsByField
      .map((t) => t.documentId)
      .filter(Boolean);
    console.log(
      `[ФИЛЬТР] ${filterField} >= ${min} — documentIds:`,
      filteredIds
    );
  }
  useEffect(() => {
    if (token) fetchTns(token);
  }, [token, fetchTns]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => fetchTns(token), 60_000);
    return () => clearInterval(id);
  }, [token, fetchTns]);

  // play notification sound when new TN appears
  const prevTnIdsRef = useRef([]);
  useEffect(() => {
    // skip on initial load
    if (prevTnIdsRef.current.length > 0) {
      const currentIds = tns.map((t) => t.id);
      const newIds = currentIds.filter(
        (id) => !prevTnIdsRef.current.includes(id)
      );
      if (newIds.length > 0) {
        const audio = new Audio("/sounds/sound.mp3");
        // play audio, ignore any playback errors
        audio.play().catch(() => {});
      }
    }
    // update reference for next comparison
    prevTnIdsRef.current = tns.map((t) => t.id);
  }, [tns]);

  // ──────────────────────── 2. Фильтры / Пагинация через хуки ───────
  const { filterableFields, filters, setFilterValue, filteredTns } =
    useTnFilters(filteredTnsByField);

  // ──────────────── New Pagination State ────────────────
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredTnsByField.slice(start, end);
  }, [filteredTnsByField, page]);

  // Сброс страницы при изменении фильтра из url (filterField или minValue)
  useEffect(() => {
    setPage(1);
  }, [filterField, minValue]);

  // ──────────────────────── 3. DATA ⇢ TABLE ROWS ────────────────────
  const [editing, setEditing] = useState(null); // редактируемое поле { tnId, docId, fieldKey, label }
  const [editValue, setEditValue] = useState(""); // значение редактируемого поля

  const openEdit = (tnId, docId, fieldKey, label, value) => {
    setEditing({ tnId, docId, fieldKey, label });
    setEditValue(value ?? "");
  };

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
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: { [fieldKey]: { value: newVal } },
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      message.success("Поле обновлено");
    } catch (e) {
      console.error(e);
      message.error("Не удалось сохранить на сервере");
    } finally {
      setEditing(null);
    }
  };

  const dataSource = paginatedRows.map((item) => ({
    key: item.id,
    raw: item,
    number: item.F81_010_NUMBER?.value ?? "—",
    prodDept: item.SCNAME?.value ?? "—", // Производственное отделение
    branch: item.OWN_SCNAME?.value ?? "—", // Филиал
    objectN: item.F81_041_ENERGOOBJECTNAME?.value ?? "—", // Объект
    dispCenter: item.DISPCENTER_NAME_?.value ?? "—", // Дисп. центр
    status: item.STATUS_NAME?.value ?? "—",
    eventDate: item.F81_060_EVENTDATETIME?.value
      ? dayjs(item.F81_060_EVENTDATETIME.value).format("DD.MM.YYYY HH:mm")
      : "—",
  }));

  // ──────────────────────── 4. COLUMNS ──────────────────────────────
  const columns = [
    { title: "№ ТН", dataIndex: "number", key: "number" },
    {
      title: "Производственное отделение",
      dataIndex: "prodDept",
      key: "prodDept",
    },
    { title: "Филиал", dataIndex: "branch", key: "branch" },
    { title: "Объект", dataIndex: "objectN", key: "objectN" },
    { title: "Дисп. центр", dataIndex: "dispCenter", key: "dispCenter" },
    { title: "Статус", dataIndex: "status", key: "status" },
    { title: "Дата/время", dataIndex: "eventDate", key: "eventDate" },
  ];

  const router = useRouter();
  const clearFilters = () => {
    filterableFields.forEach((k) => setFilterValue(k, "Все"));
    setPage(1);
    router.replace("/dashboard");
  };

  const expandedRowRender = (record) => {
    const { main, dateStatus, outageConsumer, resources, others } = groupFields(
      record.raw
    );

    const renderDescriptions = (fields) =>
      fields.map(([key, v], idx) => {
        const zebraBg = idx % 2 ? "#fafafa" : undefined; // чёт/нечёт
        const canEdit = v.edit === "Да";

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
              {typeof v.value === "string" || typeof v.value === "number"
                ? String(v.value)
                : JSON.stringify(v.value)}
              {canEdit && (
                <EditOutlined
                  style={{ marginLeft: 8, cursor: "pointer", color: "#389e0d" }}
                  onClick={() => {
                    const docId = record.raw.documentId;
                    openEdit(record.raw.id, docId, key, v.label, v.value);
                  }}
                />
              )}
            </>
          ),
          // визуальный стиль: зебра + зелёная заливка для редактируемых
          labelStyle: {
            background: canEdit ? "#f6ffed" : zebraBg,
            ...(!canEdit && zebraBg ? { transition: "background 0.3s" } : {}),
          },
          contentStyle: {
            background: canEdit ? "#f6ffed" : zebraBg,
            ...(!canEdit && zebraBg ? { transition: "background 0.3s" } : {}),
          },
        };
      });

    // Prepare main tab header with key fields in a Descriptions
    const mainHeaderItems = main.filter(([key]) =>
      [
        "F81_010_NUMBER",
        "VIOLATION_TYPE",
        "STATUS_NAME",
        "VIOLATION_GUID_STR",
        "SCNAME",
        "OWN_SCNAME",
        "DISPCENTER_NAME_",
      ].includes(key)
    );

    // Render Descriptions for each tab
    const tabsItems = [
      {
        key: "main",
        label: "Основное",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDescriptions(main)}
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
            items={renderDescriptions(dateStatus)}
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
            items={renderDescriptions(outageConsumer)}
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
            items={renderDescriptions(resources)}
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
            items={renderDescriptions(others)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
    ];

    return (
      <>
        {/* кнопки отправки */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
            padding: 16,
            marginBottom: 20,
            border: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 16,
          }}
        >
          <div style={{ fontWeight: 500, marginRight: 16 }}>
            Отправка данных:
          </div>
          <SendButtons
            tn={record.raw}
            onFieldChange={(patch) => {
              Object.entries(patch).forEach(([k, v]) =>
                updateField(record.raw.id, k, v)
              );
            }}
          />
        </div>

        <Tabs
          size="small"
          items={tabsItems}
          destroyInactiveTabPane
          style={{ marginTop: 12 }}
        />
      </>
    );
  };

  // ──────────────────────── 6. RENDER ───────────────────────────────
  return (
    <ConfigProvider locale={ru_RU}>
      <div style={{ padding: 20 }}>
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
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {filterableFields.map((key) => {
            // Используем исходный tns для фильтра и выпадающих списков
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
                  // Если был активен url-фильтр, сбрасываем url и пагинацию
                  if (filterField || minValue) {
                    router.replace("/dashboard");
                  }
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
              expandable={{ expandedRowRender }}
              rowKey="key"
            />
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Pagination
                current={page}
                total={filteredTnsByField.length}
                pageSize={pageSize}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>
      <Modal
        title={editing?.label}
        open={!!editing}
        onOk={saveEdit}
        onCancel={() => setEditing(null)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
        />
      </Modal>
    </ConfigProvider>
  );
}
