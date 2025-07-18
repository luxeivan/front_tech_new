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
  Modal,
  Input,
  message,
} from "antd";
import ru_RU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { ReloadOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

import { useTnsDataStore } from "@/stores/tnsDataStore";

dayjs.locale("ru");

const { Title } = Typography;

// --- helper: fetch & show Social Objects full info ----------------------
const SoInfo = ({ tnId, docId }) => {
  const [docIds, setDocIds]   = React.useState(null);   // array of linked ids
  const [details, setDetails] = React.useState({});     // { docId : socialObject }
  const { data: session }     = useSession();
  const token                 = session?.user?.jwt;

  // 1) запрашиваем список documentId соц‑объектов, связанных с ТН
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
                ? c.SocialObjects
                    .map((o) => o.documentId)
                    .filter(Boolean)
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

  // 2) для каждого documentId вытягиваем детальную инфу (кэшируется в `details`)
  React.useEffect(() => {
    if (!docIds) return;
    docIds.forEach(async (id) => {
      if (details[id] !== undefined) return; // уже есть / грузится

      // помечаем как «loading»
      setDetails((p) => ({ ...p, [id]: null }));

      try {
        const url =
          `${process.env.NEXT_PUBLIC_STRAPI_URL}` +
          `/api/soczialnye-obekties?filters[documentId][$eq]=${id}&populate=*`;
        const res  = await fetch(url, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        const json = await res.json();
        const so   = json?.data?.[0] ?? undefined; // undefined → не найден

        setDetails((p) => ({ ...p, [id]: so }));
      } catch (e) {
        console.error("Ошибка загрузки соц‑объекта", id, e);
        setDetails((p) => ({ ...p, [id]: undefined }));
      }
    });
  }, [docIds, details, token]);

  if (!docIds || docIds.length === 0) return null;

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
// -------------------------------------------------------------------------

export default function MainContent() {
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

  /* pagination */
  /* dynamic filters */
  const filterableFields = useMemo(() => {
    const set = new Set();
    tns.forEach((t) => {
      Object.entries(t).forEach(([k, v]) => {
        if (v && typeof v === "object" && v.filter === "Да") set.add(k);
      });
    });
    return Array.from(set);
  }, [tns]);

  // filters object: { fieldKey : selectedValue }
  const [filters, setFilters] = useState({});

  // whenever available filterable fields change – initialise to "Все"
  useEffect(() => {
    const initial = {};
    filterableFields.forEach((k) => (initial[k] = "Все"));
    setFilters(initial);
  }, [filterableFields]);

  const updateFilter = (fieldKey, value) =>
    setFilters((prev) => ({ ...prev, [fieldKey]: value }));

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const sliceStart = (page - 1) * pageSize;

  /* filtering of rows according to `filters` */
  const filteredTns = tns.filter((item) =>
    filterableFields.every((key) => {
      const selected = filters[key] ?? "Все";
      if (selected === "Все") return true;
      return (item[key]?.value ?? "—") === selected;
    })
  );

  const currentRows = filteredTns.slice(sliceStart, sliceStart + pageSize);

  /* inline‑edit modal */
  const [editing, setEditing] = useState(null); // { tnId, docId, fieldKey, label }
  const [editValue, setEditValue] = useState("");

  const openEdit = (tnId, docId, fieldKey, label, value) => {
    setEditing({ tnId, docId, fieldKey, label });
    setEditValue(value ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { tnId, docId, fieldKey } = editing;
    const newVal = editValue?.trim();

    // 1) сразу обновляем в сторе
    updateField(tnId, fieldKey, newVal);

    // 2) пытаемся сохранить на сервере
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

  /* map to table rows */
  const dataSource = currentRows.map((item) => ({
    key: item.id,
    raw: item,
    number: item.F81_010_NUMBER?.value ?? "—",
    dispatcher: item.CREATE_USER?.value ?? "—",
    status: item.STATUS_NAME?.value ?? "—",
    eventDate: item.F81_060_EVENTDATETIME?.value
      ? dayjs(item.F81_060_EVENTDATETIME.value).format("DD.MM.YYYY HH:mm")
      : "—",
  }));

  const columns = [
    { title: "№ ТН", dataIndex: "number", key: "number" },
    { title: "Диспетчер", dataIndex: "dispatcher", key: "dispatcher" },
    { title: "Статус", dataIndex: "status", key: "status" },
    { title: "Дата/время", dataIndex: "eventDate", key: "eventDate" },
  ];

  /* карточка раскрытия: перебираем все компоненты с label/value */
  const expandedRowRender = (record) => {
    const items = Object.entries(record.raw)
      .filter(
        ([, v]) =>
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
                    style={{ marginLeft: 8, cursor: "pointer" }}
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
          }))}
        />
        <SoInfo tnId={record.raw.id} docId={record.raw.documentId} />
      </>
    );
  };

  return (
    <ConfigProvider locale={ru_RU}>
      <div style={{ padding: 20 }}>
        <Space
          style={{
            marginBottom: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Технологические нарушения
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => token && fetchTns(token)}
          >
            Обновить
          </Button>
        </Space>
        <Space style={{ marginBottom: 16 }} wrap>
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
                onChange={(val) => updateFilter(key, val)}
                options={[
                  { value: "Все", label: `${label}: Все` },
                  ...values.map((v) => ({ value: v, label: v })),
                ]}
              />
            );
          })}
        </Space>

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
