"use client";

import "@/app/globals.css";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Typography,
  Spin,
  Descriptions,
  Card,
  Modal,
  Input,
  message,
  Button,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/ru";
dayjs.locale("ru");
import { useSession } from "next-auth/react";
import { useDashboardTestStore } from "@/stores/dashboardTestStore";

const { Title } = Typography;

const val = (obj) =>
  typeof obj === "object" && obj !== null && "value" in obj ? obj.value : obj;

const formatDate = (d) => (d ? dayjs(d).format("DD.MM.YYYY HH:mm:ss") : "—");

export default function MainPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.jwt ?? null;

  const { uniqueOpen, isLoading, error, loadUnique } = useDashboardTestStore();

  const [countdown, setCountdown] = useState(60);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [editing, setEditing] = useState(null);

  // save edited field via Strapi and refresh table
  const handleSaveEdit = async () => {
    if (!editing) return;
    const { documentId, fieldKey, value } = editing;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${documentId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ data: { [fieldKey]: { value } } }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Поле обновлено");
      await loadUnique(token);
      setEditing(null);
    } catch (e) {
      console.error("Update failed", e);
      message.error("Не удалось сохранить изменения");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (expandedKeys.length > 0 || editing) return prev;
        if (prev <= 1) {
          window.location.reload();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [expandedKeys, editing]);

  
  useEffect(() => {
    if (status === "authenticated" && uniqueOpen.length === 0) {
      loadUnique(token);
    }
  }, [status, token, uniqueOpen.length, loadUnique]);

  const sorted = [...uniqueOpen].sort(
    (a, b) =>
      new Date(val(b.F81_060_EVENTDATETIME) || b.createdAt) -
      new Date(val(a.F81_060_EVENTDATETIME) || a.createdAt)
  );

  const dataSource = useMemo(
    () =>
      sorted.map((r) => ({
        key: r.guid,
        number: val(r.F81_010_NUMBER),
        object: val(r.F81_042_DISPNAME),
        address: val(r.ADDRESS_LIST),
        center: val(r.DISPCENTER_NAME_),
        event: formatDate(val(r.F81_060_EVENTDATETIME)),
        full: r,
        documentId: r.documentId,
      })),
    [uniqueOpen]
  );

  const columns = [
    { title: "№ ТН", dataIndex: "number", key: "number", width: 120 },
    { title: "Объект", dataIndex: "object", key: "object", responsive: ["md"] },
    {
      title: "Адрес",
      dataIndex: "address",
      key: "address",
      responsive: ["lg"],
    },
    {
      title: "Дисп. центр",
      dataIndex: "center",
      key: "center",
      width: 160,
      responsive: ["md"],
    },
    {
      title: "Дата/время возникновения",
      dataIndex: "event",
      key: "event",
      width: 180,
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
        {`Всего открытых ТН: ${uniqueOpen.length}`}
      </Title>
      <div style={{ textAlign: "center", marginBottom: 24, color: "#888" }}>
        Обновление через: {countdown} секунд(ы)
      </div>

      {isLoading && !error && (
        <div style={{ textAlign: "center", padding: 100 }}>
          <Spin size="large" />
        </div>
      )}

      {error && (
        <Title level={4} type="danger" style={{ textAlign: "center" }}>
          {error}
        </Title>
      )}

      {!isLoading && !error && (
        <Card
          style={{ borderRadius: 16, boxShadow: "0 8px 18px rgba(0,0,0,0.05)" }}
        >
          <Table
            columns={columns}
            dataSource={dataSource}
            bordered
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowClassName={(record, index) =>
              index % 2 === 0 ? "row-light" : ""
            }
            expandable={{
              expandedRowRender: (record) => {
                const hideFields = new Set([
                  "documentId",
                  "updatedAt",
                  "createdAt",
                  "publishedAt",
                  "id",
                  "SBYT_NOTIFICATION",
                  "SBYT_NOTIFICATION_STR",
                  "guid",
                  "OBJECTNAMEKEY",
                  "SWITCHNAMEKEY",
                  "VIOLATION_GUID_STR",
                ]);
                const entries = Object.entries(record.full).filter(
                  ([k]) => !hideFields.has(k)
                );
                return (
                  <Descriptions
                    size="small"
                    column={1}
                    bordered
                    items={entries.map(([k, v]) => {
                      const label =
                        v && typeof v === "object" && "label" in v
                          ? v.label
                          : k;
                      let rawVal =
                        v == null
                          ? null
                          : typeof v === "object" && "value" in v
                          ? v.value
                          : v;
                      const isEditable =
                        v && typeof v === "object" && v.edit === "Да";
                      let display = "Нет данных";
                      if (rawVal != null && rawVal !== "") {
                        display = String(rawVal);
                        if (typeof rawVal === "string" && /\d{4}-\d{2}-\d{2}T/.test(rawVal)) {
                          display = dayjs(rawVal).format("DD.MM.YYYY HH:mm:ss");
                        }
                      }
                      return {
                        key: k,
                        label,
                        children: (
                          <span>
                            {display}
                            {isEditable && (
                              <EditOutlined
                                style={{ color: "#52c41a", marginLeft: 8, cursor: "pointer" }}
                                onClick={() =>
                                  setEditing({
                                    recordKey: record.key,
                                    documentId: record.full.documentId,
                                    fieldKey: k,
                                    label,
                                    value: display,
                                    previousValue: display,
                                  })
                                }
                              />
                            )}
                          </span>
                        ),
                      };
                    })}
                  />
                );
              },
              rowExpandable: () => true,
              expandedRowKeys: expandedKeys,
              onExpand: (expanded, record) => {
                setExpandedKeys(expanded ? [record.key] : []);
              },
            }}
            scroll={{ x: true }}
          />
        </Card>
      )}

      {editing && (
        <Modal
          title={editing.label}
          open
          onCancel={() => setEditing(null)}
          onOk={handleSaveEdit}
          okText="Сохранить"
          cancelText="Отмена"
        >
          <Input
            value={editing.value}
            onChange={(e) =>
              setEditing((prev) => ({ ...prev, value: e.target.value }))
            }
            autoFocus
          />
        </Modal>
      )}
    </div>
  );
}
