"use client";
import React, { useEffect, useState, useMemo } from "react";
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
  Collapse,
  Modal,
  Input,
  message,
} from "antd";
import ru_RU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { ReloadOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import {
  useTnsDataStore,
  useTnFilters,
  usePaging,
} from "@/stores/tnsDataStore";
dayjs.locale("ru");
const { Title } = Typography;

const SoInfo = ({ tnId, docId }) => {
  const [docIds, setDocIds] = React.useState(null); // список documentId соц‑объектов для данного ТН (null => ещё не загружено)
  const [details, setDetails] = React.useState({}); // map: { documentId : объект‑детали | null (loading) | undefined (error) }
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

  /* for each docId запрашиваем /soczialnye-obekties?filters[...]…
     детали пишем в `details`, при ошибке → undefined */
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

export default function MainContent() {
  // ──────────────────────── 1. AUTH & STORE ────────────────────────
  const { data: session } = useSession();
  const token = session?.user?.jwt;
  const { tns, loading, error, fetchTns, updateField } = useTnsDataStore();
  useEffect(() => {
    if (token) fetchTns(token);
  }, [token, fetchTns]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => fetchTns(token), 120_000);
    return () => clearInterval(id);
  }, [token, fetchTns]);

  // ──────────────────────── 2. Фильтры / Пагинация через хуки ───────
  const { filterableFields, filters, setFilterValue, filteredTns } =
    useTnFilters();

  const {
    page,
    setPage,
    current: currentRows,
    pageSize,
  } = usePaging(filteredTns, 10);

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

  const dataSource = currentRows.map((item) => ({
    key: item.id,
    raw: item,
    number: item.F81_010_NUMBER?.value ?? "—",
    prodDept: item.SCNAME?.value ?? "—",           // Производственное отделение
    branch:   item.OWN_SCNAME?.value ?? "—",       // Филиал
    objectN:  item.F81_041_ENERGOOBJECTNAME?.value ?? "—", // Объект
    dispCenter: item.DISPCENTER_NAME_?.value ?? "—",       // Дисп. центр
    status: item.STATUS_NAME?.value ?? "—",
    eventDate: item.F81_060_EVENTDATETIME?.value
      ? dayjs(item.F81_060_EVENTDATETIME.value).format("DD.MM.YYYY HH:mm")
      : "—",
  }));

  // ──────────────────────── 4. COLUMNS ──────────────────────────────
  const columns = [
    { title: "№ ТН", dataIndex: "number", key: "number" },
    { title: "Производственное отделение", dataIndex: "prodDept", key: "prodDept" },
    { title: "Филиал", dataIndex: "branch", key: "branch" },
    { title: "Объект", dataIndex: "objectN", key: "objectN" },
    { title: "Дисп. центр", dataIndex: "dispCenter", key: "dispCenter" },
    { title: "Статус", dataIndex: "status", key: "status" },
    { title: "Дата/время", dataIndex: "eventDate", key: "eventDate" },
  ];

  const clearFilters = () => {
    filterableFields.forEach((k) => setFilterValue(k, "Все"));
    setPage(1);
  };

  const expandedRowRender = (record) => {
    const items = Object.entries(record.raw)
      .filter(
        ([key, v]) =>
          // пропускаем “тех‑поля”, которые не должны отображаться
          !["OBJECTNAMEKEY", "SWITCHNAMEKEY", "PVS_RP116_10BR_F20"].includes(
            key
          ) &&
          v &&
          typeof v === "object" &&
          "label" in v &&
          v.value !== undefined &&
          v.value !== null &&
          v.value !== ""
      )
      .map(([key, v]) => ({
        key,
        label: v.label,
        value:
          typeof v.value === "string" || typeof v.value === "number"
            ? String(v.value)
            : JSON.stringify(v.value),
        canEdit: v.edit === "Да",
      }));

    return (
      <>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={items.map((it) => ({
            key: it.key,
            label: it.label,
            children: (
              <>
                {it.value}{" "}
                {it.canEdit && (
                  <EditOutlined
                    style={{
                      marginLeft: 8,
                      cursor: "pointer",
                      color: "#389e0d",
                    }}
                    onClick={() => {
                      const docId = record.raw.documentId;
                      openEdit(
                        record.raw.id,
                        docId,
                        it.key,
                        it.label,
                        it.value
                      );
                    }}
                  />
                )}
              </>
            ),
            // если поле редактируемое, красим label+value #f6ffed
            ...(it.canEdit
              ? {
                  labelStyle: { background: "#f6ffed" },
                  contentStyle: { background: "#f6ffed" },
                }
              : {}),
          }))}
        />

        <Collapse
          bordered={false}
          destroyInactivePanel
          size="small"
          style={{ marginTop: 12 }}
        >
          <Collapse.Panel header="Соц объекты" key="so">
            <SoInfo tnId={record.raw.id} docId={record.raw.documentId} />
          </Collapse.Panel>
        </Collapse>
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
            const values = Array.from(
              new Set(tns.map((t) => t[key]?.value).filter(Boolean))
            );
            const label = tns.find((t) => t[key])?.[key]?.label ?? key;
            return (
              <Select
                key={key}
                value={filters[key] ?? "Все"}
                style={{ width: 220 }}
                onChange={(val) => setFilterValue(key, val)}
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
                total={filteredTns.length}
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
